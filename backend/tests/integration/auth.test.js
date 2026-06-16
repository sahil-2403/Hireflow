import request from "supertest";
import { vi } from "vitest";

vi.mock("../../src/shared/services/email.service.js", () => ({
  default: vi.fn().mockResolvedValue({
    messageId: "test-email-id",
  }),
}));

import app from "../../src/app.js";

import User from "../../src/modules/auth/auth.model.js";
import EmailVerificationToken from "../../src/modules/auth/emailVerificationToken.model.js";
import RefreshToken from "../../src/modules/auth/refreshToken.model.js";

import { ROLES } from "../../src/config/constants.js";

describe("Authentication API", () => {
  const validCandidate = {
    username: "sahil_test",
    email: "sahil.test@example.com",
    password: "Password123",
  };

  test("registers a candidate and stores a hashed password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(validCandidate)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Registration successful");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: validCandidate.email,
        userId: expect.any(String),
      }),
    );

    expect(response.body.data.verificationUrl).toBeUndefined();

    const user = await User.findOne({
      email: validCandidate.email,
    }).select("+password");

    expect(user).not.toBeNull();
    expect(user.password).not.toBe(validCandidate.password);

    expect(user.role).toBe(ROLES.CANDIDATE);
    expect(user.isEmailVerified).toBe(false);

    const verificationToken = await EmailVerificationToken.findOne({
      userId: user._id,
    });

    expect(verificationToken).not.toBeNull();
    expect(verificationToken.tokenHash).toEqual(expect.any(String));
  });

  test("rejects an invalid registration payload", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "ab",
        email: "invalid-email",
        password: "weak",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(response.body.errors.length).toBeGreaterThan(0);

    expect(await User.countDocuments()).toBe(0);
  });

  test("prevents login before email verification", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send(validCandidate)
      .expect(201);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: validCandidate.email,
        password: validCandidate.password,
      })
      .expect(403);

    expect(response.body.message).toBe(
      "Please verify your email before logging in",
    );
  });

  test("logs in a verified candidate and creates a refresh session", async () => {
    const user = await User.create({
      ...validCandidate,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
    });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: validCandidate.email,
        password: validCandidate.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: validCandidate.email,
          role: ROLES.CANDIDATE,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );

    const storedRefreshTokens = await RefreshToken.find({
      userId: user._id,
    });

    expect(storedRefreshTokens).toHaveLength(1);

    expect(storedRefreshTokens[0].tokenHash).not.toBe(
      response.body.data.refreshToken,
    );
  });

  test("rejects incorrect login credentials", async () => {
    await User.create({
      ...validCandidate,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: validCandidate.email,
        password: "WrongPassword123",
      })
      .expect(401);

    expect(response.body.message).toBe("Invalid email or password");
  });
});
