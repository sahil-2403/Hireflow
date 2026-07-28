import crypto from "node:crypto";

import User from "./auth.model.js";
import AuthSession from "./authSession.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt.js";

import { hashToken } from "../../shared/utils/token.js";

const REFRESH_TOKEN_EXPIRY_DAYS =
  Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7;

const SESSION_REVOKE_REASONS = Object.freeze({
  USER_LOGOUT: "user_logout",
  USER_LOGOUT_ALL: "user_logout_all",
  PASSWORD_RESET: "password_reset",
  REFRESH_TOKEN_REUSE: "refresh_token_reuse",
});

const getAuthVersion = (user) => {
  return Number(user?.authVersion ?? 0);
};

const getRefreshSessionExpiry = () => {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
};

const buildAccessToken = (user, sessionId) => {
  return generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
    sid: sessionId,
    authVersion: getAuthVersion(user),
    type: "access",
  });
};

const buildRefreshToken = (user, sessionId) => {
  return generateRefreshToken({
    sub: user._id.toString(),
    role: user.role,
    sid: sessionId,
    authVersion: getAuthVersion(user),
    type: "refresh",
    jti: crypto.randomUUID(),
  });
};

const assertRefreshTokenPayload = (decoded) => {
  if (decoded?.type !== "refresh" || !decoded?.sub || !decoded?.sid) {
    throw new ApiError(401, "Invalid refresh token");
  }
};

const createAuthSession = async (user) => {
  const sessionId = crypto.randomUUID();

  const accessToken = buildAccessToken(user, sessionId);
  const refreshToken = buildRefreshToken(user, sessionId);

  const now = new Date();

  await AuthSession.create({
    sessionId,
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: getRefreshSessionExpiry(),
    lastUsedAt: now,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const revokeSessionRecord = async (
  sessionId,
  reason,
  revokedAt = new Date(),
) => {
  await AuthSession.updateOne(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt,
        revokedReason: reason,
      },
    },
  );
};

const rotateAuthSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const decoded = verifyRefreshToken(refreshToken);

  assertRefreshTokenPayload(decoded);

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  const tokenAuthVersion = Number(decoded.authVersion);
  const userAuthVersion = getAuthVersion(user);

  if (
    !Number.isInteger(tokenAuthVersion) ||
    tokenAuthVersion !== userAuthVersion
  ) {
    throw new ApiError(401, "This session has been revoked");
  }

  const now = new Date();

  const session = await AuthSession.findOne({
    sessionId: decoded.sid,
    userId: user._id,
  }).select("+refreshTokenHash");

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= now.getTime()
  ) {
    throw new ApiError(401, "Invalid or expired refresh session");
  }

  const currentRefreshTokenHash = hashToken(refreshToken);

  /*
   * A validly signed refresh token was presented,
   * but it is no longer the current token for this
   * session. This usually indicates reuse of a
   * previously rotated token.
   */
  if (session.refreshTokenHash !== currentRefreshTokenHash) {
    await revokeSessionRecord(
      session._id,
      SESSION_REVOKE_REASONS.REFRESH_TOKEN_REUSE,
      now,
    );

    throw new ApiError(
      401,
      "Refresh token reuse detected. Please log in again.",
    );
  }

  const nextAccessToken = buildAccessToken(user, session.sessionId);
  const nextRefreshToken = buildRefreshToken(user, session.sessionId);

  /*
   * Including the current hash in the update query
   * makes rotation atomic. Only one request using
   * the current refresh token can succeed.
   */
  const rotatedSession = await AuthSession.findOneAndUpdate(
    {
      _id: session._id,
      refreshTokenHash: currentRefreshTokenHash,
      revokedAt: null,
      expiresAt: {
        $gt: now,
      },
    },
    {
      $set: {
        refreshTokenHash: hashToken(nextRefreshToken),
        expiresAt: getRefreshSessionExpiry(),
        lastUsedAt: now,
      },
    },
    {
      new: true,
    },
  );

  if (!rotatedSession) {
    await revokeSessionRecord(
      session._id,
      SESSION_REVOKE_REASONS.REFRESH_TOKEN_REUSE,
      now,
    );

    throw new ApiError(
      401,
      "Refresh token reuse detected. Please log in again.",
    );
  }

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  };
};

const getSessionIdentityFromToken = ({ token, verifyToken, expectedType }) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);

    if (decoded?.type !== expectedType || !decoded?.sub || !decoded?.sid) {
      return null;
    }

    return {
      userId: decoded.sub,
      sessionId: decoded.sid,
    };
  } catch {
    return null;
  }
};

const revokeCurrentAuthSession = async ({ refreshToken, accessToken }) => {
  /*
   * Prefer the refresh token because its cookie is
   * specifically scoped to authentication routes.
   * The access token is a fallback when the refresh
   * cookie is absent or invalid.
   */
  const identity =
    getSessionIdentityFromToken({
      token: refreshToken,
      verifyToken: verifyRefreshToken,
      expectedType: "refresh",
    }) ||
    getSessionIdentityFromToken({
      token: accessToken,
      verifyToken: verifyAccessToken,
      expectedType: "access",
    });

  if (!identity) {
    return;
  }

  await AuthSession.updateOne(
    {
      sessionId: identity.sessionId,
      userId: identity.userId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: SESSION_REVOKE_REASONS.USER_LOGOUT,
      },
    },
  );
};

const revokeAllAuthSessions = async (
  userId,
  reason = SESSION_REVOKE_REASONS.USER_LOGOUT_ALL,
) => {
  const revocationStartedAt = new Date();

  /*
   * authVersion is the authoritative account-wide
   * kill switch. Once incremented, every old access
   * and refresh token immediately becomes invalid.
   */
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        authVersion: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  /*
   * Keep revoked sessions temporarily for auditing
   * and reuse detection. The TTL index removes them
   * after their expiry date.
   *
   * Sessions created after revocation began are not
   * revoked. They will already contain the new
   * authVersion.
   */
  await AuthSession.updateMany(
    {
      userId,
      revokedAt: null,
      createdAt: {
        $lte: revocationStartedAt,
      },
    },
    {
      $set: {
        revokedAt: revocationStartedAt,
        revokedReason: reason,
      },
    },
  );

  return user;
};

export {
  SESSION_REVOKE_REASONS,
  createAuthSession,
  rotateAuthSession,
  revokeCurrentAuthSession,
  revokeAllAuthSessions,
};
