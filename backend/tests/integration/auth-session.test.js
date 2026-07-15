import request from "supertest";

import app from "../../src/app.js";

import RefreshToken from "../../src/modules/auth/refreshToken.model.js";

import { ROLES } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  invalidAccessCookieHeader,
  refreshHeader,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

describe("Authentication sessions", () => {
  const candidateData = {
    username: "session_candidate",
    email: "session.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  test("GET /auth/me returns the authenticated user from cookie session", async () => {
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

  test("rotates the refresh token cookie and invalidates the old refresh session", async () => {
    const user = await createVerifiedUser(candidateData);

    const loginResult = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const oldRefreshToken = loginResult.refreshToken;

    expect(oldRefreshToken).toEqual(expect.any(String));

    const refreshResponse = await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );

    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.message).toBe("Token refreshed successfully");

    const storedSessions = await RefreshToken.find({
      userId: user._id,
    });

    expect(storedSessions).toHaveLength(1);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .set(refreshHeader(oldRefreshToken))
      .expect(403);

    await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );
  });

  test("logout removes only the supplied refresh cookie session", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const secondSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(2);

    await postWithCsrf(firstSession.agent, "/api/v1/auth/logout", {}, 200);

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(1);

    await postWithCsrf(
      firstSession.agent,
      "/api/v1/auth/refresh-token",
      {},
      401,
    );

    await postWithCsrf(
      secondSession.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );
  });

  test("logout-all removes every refresh session", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const secondSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(2);

    await postWithCsrf(firstSession.agent, "/api/v1/auth/logout-all", {}, 200);

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(0);

    await postWithCsrf(
      firstSession.agent,
      "/api/v1/auth/refresh-token",
      {},
      401,
    );

    await postWithCsrf(
      secondSession.agent,
      "/api/v1/auth/refresh-token",
      {},
      401,
    );
  });

  test("deactivated user cannot access a protected route with an existing cookie", async () => {
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
