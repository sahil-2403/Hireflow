import ApiError from "../errors/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { verifyAccessToken } from "../utils/jwt.js";

import User from "../../modules/auth/auth.model.js";
import AuthSession from "../../modules/auth/authSession.model.js";

import { getAccessTokenCookieName } from "../../modules/auth/auth.cookie.js";

const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies?.[getAccessTokenCookieName()];

  if (!accessToken) {
    throw new ApiError(401, "Authentication token missing");
  }

  const decoded = verifyAccessToken(accessToken);

  if (decoded?.type !== "access" || !decoded?.sub || !decoded?.sid) {
    throw new ApiError(401, "Invalid session token");
  }

  const now = new Date();

  const [user, session] = await Promise.all([
    User.findById(decoded.sub),

    AuthSession.findOne({
      sessionId: decoded.sid,
      userId: decoded.sub,
      revokedAt: null,
      expiresAt: {
        $gt: now,
      },
    }),
  ]);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  const tokenAuthVersion = Number(decoded.authVersion);
  const userAuthVersion = Number(user.authVersion ?? 0);

  if (
    !Number.isInteger(tokenAuthVersion) ||
    tokenAuthVersion !== userAuthVersion
  ) {
    throw new ApiError(401, "This session has been revoked");
  }

  if (!session) {
    throw new ApiError(401, "This session is no longer active");
  }

  req.user = {
    username: user.username,
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl,
  };

  req.auth = {
    sessionId: session.sessionId,
    authVersion: userAuthVersion,
  };

  next();
});

export default authenticate;
