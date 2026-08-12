import { describe, expect, test } from "vitest";

import User from "../../src/modules/auth/auth.model.js";
import { ROLES } from "../../src/config/constants.js";
import {
  getAccessTokenCookieName,
  getRefreshTokenCookieName,
} from "../../src/modules/auth/auth.cookie.js";

import {
  createVerifiedUser,
  loginUser,
  getCookieValue,
  getSetCookies,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

describe("Authentication token lifecycle", () => {
  const candidateData = {
    username: "token_candidate",
    email: "token.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  test("GET /auth/me returns the authenticated user", async () => {
    await createVerifiedUser(candidateData);
    const { agent } = await loginUser(candidateData);

    const response = await agent.get("/api/v1/auth/me").expect(200);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: candidateData.email,
        role: ROLES.CANDIDATE,
      }),
    );
  });

  test("refresh creates a new access cookie without rotating refresh token", async () => {
    await createVerifiedUser(candidateData);
    const loginResult = await loginUser(candidateData);

    const response = await postWithCsrf(
      loginResult.agent,
      "/api/v1/auth/refresh-token",
      {},
      200,
    );

    const cookies = getSetCookies(response);
    const accessToken = getCookieValue(cookies, getAccessTokenCookieName());
    const refreshToken = getCookieValue(cookies, getRefreshTokenCookieName());

    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toBeNull();

    await loginResult.agent.get("/api/v1/auth/me").expect(200);
  });

  test("logout clears the current browser authentication cookies", async () => {
    await createVerifiedUser(candidateData);
    const { agent } = await loginUser(candidateData);

    await postWithCsrf(agent, "/api/v1/auth/logout", {}, 200);
    await agent.get("/api/v1/auth/me").expect(401);
  });

  test("logout all increments tokenVersion and invalidates other device tokens", async () => {
    const user = await createVerifiedUser(candidateData);

    const firstDevice = await loginUser(candidateData);
    const secondDevice = await loginUser(candidateData);

    await postWithCsrf(firstDevice.agent, "/api/v1/auth/logout-all", {}, 200);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.tokenVersion).toBe(1);

    await secondDevice.agent.get("/api/v1/auth/me").expect(401);

    await postWithCsrf(
      secondDevice.agent,
      "/api/v1/auth/refresh-token",
      {},
      401,
    );
  });
});
