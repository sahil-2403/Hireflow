import request from "supertest";

import app from "../../src/app.js";

import User from "../../src/modules/auth/auth.model.js";
import RefreshToken from "../../src/modules/auth/refreshToken.model.js";

import { ROLES } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  authHeader,
} from "../helpers/auth.helpers.js";

describe("Authentication sessions", () => {
  const candidateData = {
    username: "session_candidate",
    email: "session.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  test("GET /auth/me returns the authenticated user", async () => {
    await createVerifiedUser(candidateData);

    const { accessToken } = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(accessToken))
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: candidateData.email,
        role: ROLES.CANDIDATE,
      }),
    );

    expect(response.body.data.password).toBeUndefined();
  });

  test("GET /auth/me rejects a request without an access token", async () => {
    const response = await request(app).get("/api/v1/auth/me").expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("GET /auth/me rejects an invalid access token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set({
        Authorization: "Bearer invalid-token",
      })
      .expect(401);

    expect(response.body.message).toBe("Invalid or expired token");
  });

  test("rotates the refresh token and invalidates the old token", async () => {
    const user = await createVerifiedUser(candidateData);

    const loginResult = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const oldRefreshToken = loginResult.refreshToken;

    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(200);

    const newRefreshToken = refreshResponse.body.data.refreshToken;

    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));

    expect(newRefreshToken).toEqual(expect.any(String));

    expect(newRefreshToken).not.toBe(oldRefreshToken);

    const storedSessions = await RefreshToken.find({
      userId: user._id,
    });

    expect(storedSessions).toHaveLength(1);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(401);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: newRefreshToken,
      })
      .expect(200);
  });

  test("logout removes only the supplied session", async () => {
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

    await request(app)
      .post("/api/v1/auth/logout")
      .set(authHeader(firstSession.accessToken))
      .send({
        refreshToken: firstSession.refreshToken,
      })
      .expect(200);

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(1);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: firstSession.refreshToken,
      })
      .expect(401);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: secondSession.refreshToken,
      })
      .expect(200);
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

    await request(app)
      .post("/api/v1/auth/logout-all")
      .set(authHeader(firstSession.accessToken))
      .expect(200);

    expect(
      await RefreshToken.countDocuments({
        userId: user._id,
      }),
    ).toBe(0);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: firstSession.refreshToken,
      })
      .expect(401);

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .send({
        refreshToken: secondSession.refreshToken,
      })
      .expect(401);
  });

  test("deactivated user cannot access a protected route with an existing token", async () => {
    const user = await createVerifiedUser(candidateData);

    const { accessToken } = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    user.isActive = false;
    await user.save();

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set(authHeader(accessToken))
      .expect(403);

    expect(response.body.message).toBe("This account has been deactivated");
  });
});
