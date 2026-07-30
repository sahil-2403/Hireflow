import request from "supertest";

import app from "../../src/app.js";

import User from "../../src/modules/auth/auth.model.js";
import AuthSession from "../../src/modules/auth/authSession.model.js";

import { getRefreshTokenCookieName } from "../../src/modules/auth/auth.cookie.js";

import { ROLES } from "../../src/config/constants.js";

import {
  authHeader,
  createVerifiedUser,
  loginUser,
  invalidAccessCookieHeader,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

/*
 * Sends a refresh request using a previously captured
 * refresh token.
 *
 * This is necessary for testing:
 * - refresh-token reuse
 * - revoked refresh tokens
 * - logout security
 *
 * We first obtain a valid CSRF cookie and token,
 * and then manually include the captured refresh
 * token in the request cookies.
 */
const refreshWithCapturedToken = async (refreshToken, expectedStatus = 200) => {
  const csrfResponse = await request(app)
    .get("/api/v1/auth/csrf-token")
    .expect(200);

  const csrfToken = csrfResponse.body.data.csrfToken;

  const csrfCookies = csrfResponse.headers["set-cookie"] || [];

  const csrfCookieHeader = csrfCookies
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

  const refreshCookie = [getRefreshTokenCookieName(), refreshToken].join("=");

  const cookieHeader = [csrfCookieHeader, refreshCookie]
    .filter(Boolean)
    .join("; ");

  return request(app)
    .post("/api/v1/auth/refresh-token")
    .set("Cookie", cookieHeader)
    .set("X-CSRF-Token", csrfToken)
    .send({})
    .expect(expectedStatus);
};

describe("Authentication sessions", () => {
  const candidateData = {
    username: "session_candidate",
    email: "session.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  test("GET /auth/me returns the authenticated user from an active session", async () => {
    await createVerifiedUser(candidateData);

    const { agent } = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await agent.get("/api/v1/auth/me").expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: candidateData.email,
        role: ROLES.CANDIDATE,
      }),
    );

    expect(response.body.data.password).toBeUndefined();
  });

  test("GET /auth/me rejects a request without an access token cookie", async () => {
    const response = await request(app).get("/api/v1/auth/me").expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("GET /auth/me rejects an invalid access token cookie", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set(invalidAccessCookieHeader())
      .expect(401);

    expect(response.body.message).toBe("Invalid or expired token");
  });

  test("login creates one active authentication session", async () => {
    const user = await createVerifiedUser(candidateData);

    await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const sessions = await AuthSession.find({
      userId: user._id,
    });

    expect(sessions).toHaveLength(1);

    expect(sessions[0].sessionId).toEqual(expect.any(String));

    expect(sessions[0].revokedAt).toBeNull();
    expect(sessions[0].revokedReason).toBeNull();

    expect(sessions[0].expiresAt).toBeInstanceOf(Date);
    expect(sessions[0].lastUsedAt).toBeInstanceOf(Date);
  });

  test("separate logins create separate device sessions", async () => {
    const user = await createVerifiedUser(candidateData);

    await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const sessions = await AuthSession.find({
      userId: user._id,
    });

    expect(sessions).toHaveLength(2);

    expect(sessions[0].sessionId).not.toBe(sessions[1].sessionId);
  });

  test("refresh rotates the token inside the same stable session", async () => {
    const user = await createVerifiedUser(candidateData);

    const loginResult = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const sessionBeforeRotation = await AuthSession.findOne({
      userId: user._id,
      revokedAt: null,
    });

    expect(sessionBeforeRotation).not.toBeNull();

    const originalSessionId = sessionBeforeRotation.sessionId;

    const originalLastUsedAt = sessionBeforeRotation.lastUsedAt;

    const response = await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Token refreshed successfully");

    const sessionsAfterRotation = await AuthSession.find({
      userId: user._id,
    });

    expect(sessionsAfterRotation).toHaveLength(1);

    const rotatedSession = sessionsAfterRotation[0];

    expect(rotatedSession.sessionId).toBe(originalSessionId);

    expect(rotatedSession.revokedAt).toBeNull();

    expect(rotatedSession.lastUsedAt.getTime()).toBeGreaterThanOrEqual(
      originalLastUsedAt.getTime(),
    );

    await loginResult.agent.get("/api/v1/auth/me").expect(200);

    /*
     * The newly rotated refresh cookie should also
     * work for the next refresh operation.
     */
    await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );
  });

  test("reusing a rotated refresh token revokes the affected session", async () => {
    const user = await createVerifiedUser(candidateData);

    const loginResult = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const oldRefreshToken = loginResult.refreshToken;

    const oldAccessToken = loginResult.accessToken;

    /*
     * Rotate the session so oldRefreshToken is no
     * longer the current refresh token.
     */
    await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );

    const replayResponse = await refreshWithCapturedToken(oldRefreshToken, 401);

    expect(replayResponse.body.message).toBe(
      "Refresh token reuse detected. Please log in again.",
    );

    const revokedSession = await AuthSession.findOne({
      userId: user._id,
    });

    expect(revokedSession).not.toBeNull();
    expect(revokedSession.revokedAt).toBeInstanceOf(Date);

    expect(revokedSession.revokedReason).toBe("refresh_token_reuse");

    /*
     * The old access token is cryptographically
     * valid, but it must now fail because its
     * server-side session has been revoked.
     */
    await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(oldAccessToken))
      .expect(401);

    /*
     * Even the newest refresh token stored in the
     * original browser must now fail because the
     * whole device session was revoked.
     */
    await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      401,
    );
  });

  test("logout immediately revokes only the current device session", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const secondDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    expect(
      await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
      }),
    ).toBe(2);

    await postWithCsrf(firstDevice.agent, "/api/v1/auth/logout", {}, 200);

    expect(
      await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
      }),
    ).toBe(1);

    const revokedSession = await AuthSession.findOne({
      userId: user._id,
      revokedReason: "user_logout",
    });

    expect(revokedSession).not.toBeNull();
    expect(revokedSession.revokedAt).toBeInstanceOf(Date);

    /*
     * Use the access token captured before logout.
     *
     * This proves that logout revoked the server
     * session and did not merely clear the browser
     * cookies.
     */
    const revokedAccessResponse = await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(firstDevice.accessToken))
      .expect(401);

    expect(revokedAccessResponse.body.message).toBe(
      "This session is no longer active",
    );

    /*
     * A refresh token captured before logout must
     * also be unusable.
     */
    await refreshWithCapturedToken(firstDevice.refreshToken, 401);

    /*
     * The second device must remain authenticated.
     */
    await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(secondDevice.accessToken))
      .expect(200);

    await postWithCsrf(
      secondDevice.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );
  });

  test("logout remains successful when authentication cookies are missing", async () => {
    const agent = request.agent(app);

    const response = await postWithCsrf(agent, "/api/v1/auth/logout", {}, 200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("Logged out successfully");
  });

  test("logout-all immediately revokes every active device session", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const secondDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    expect(user.authVersion).toBe(0);

    expect(
      await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
      }),
    ).toBe(2);

    const logoutResponse = await postWithCsrf(
      firstDevice.agent,
      "/api/v1/auth/logout-all",
      {},
      200,
    );

    expect(logoutResponse.body.success).toBe(true);

    expect(logoutResponse.body.message).toBe(
      "Logged out from all devices successfully",
    );

    const updatedUser = await User.findById(user._id);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.authVersion).toBe(1);

    expect(
      await AuthSession.countDocuments({
        userId: user._id,
        revokedAt: null,
      }),
    ).toBe(0);

    expect(
      await AuthSession.countDocuments({
        userId: user._id,
        revokedReason: "user_logout_all",
      }),
    ).toBe(2);

    /*
     * Both access tokens were issued before the
     * authVersion increment and must fail
     * immediately.
     */
    const firstDeviceResponse = await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(firstDevice.accessToken))
      .expect(401);

    expect(firstDeviceResponse.body.message).toBe(
      "This session has been revoked",
    );

    const secondDeviceResponse = await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(secondDevice.accessToken))
      .expect(401);

    expect(secondDeviceResponse.body.message).toBe(
      "This session has been revoked",
    );

    /*
     * Refresh tokens from both devices must also
     * fail after global logout.
     */
    await refreshWithCapturedToken(firstDevice.refreshToken, 401);

    await refreshWithCapturedToken(secondDevice.refreshToken, 401);
  });

  test("a fresh login works after logout-all", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    await postWithCsrf(firstDevice.agent, "/api/v1/auth/logout-all", {}, 200);

    const updatedUser = await User.findById(user._id);

    expect(updatedUser.authVersion).toBe(1);

    const newDevice = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    await newDevice.agent.get("/api/v1/auth/me").expect(200);

    const activeSessions = await AuthSession.find({
      userId: user._id,
      revokedAt: null,
    });

    expect(activeSessions).toHaveLength(1);

    expect(activeSessions[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      updatedUser.updatedAt.getTime(),
    );
  });

  test("deactivated user cannot access a protected route with an existing session", async () => {
    const user = await createVerifiedUser(candidateData);

    const { agent } = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    user.isActive = false;

    await user.save();

    const response = await agent.get("/api/v1/auth/me").expect(403);

    expect(response.body.message).toBe("This account has been deactivated");
  });
});
