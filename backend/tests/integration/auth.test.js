import { vi } from "vitest";

vi.mock("../../src/shared/services/email.service.js", () => ({
  default: vi.fn().mockResolvedValue({
    messageId: "test-email-id",
  }),
}));

import User from "../../src/modules/auth/auth.model.js";
import EmailVerificationToken from "../../src/modules/auth/emailVerificationToken.model.js";

import AuthSession from "../../src/modules/auth/authSession.model.js";

import { hashToken } from "../../src/shared/utils/token.js";

import { ROLES } from "../../src/config/constants.js";

import {
  createTestAgent,
  getCookieValue,
  getSetCookies,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

import {
  getAccessTokenCookieName,
  getRefreshTokenCookieName,
} from "../../src/modules/auth/auth.cookie.js";

describe("Authentication API", () => {
  test("registers a candidate and stores a hashed password", async () => {
    const agent = createTestAgent();

    const candidate = {
      username: "sahil_test",
      email: "sahil.test@example.com",
      password: "Password123",
    };

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      candidate,
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "Candidate registration successful",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: candidate.email,
        userId: expect.any(String),
        role: ROLES.CANDIDATE,
      }),
    );

    expect(response.body.data.verificationUrl).toBeUndefined();

    const user = await User.findOne({
      email: candidate.email,
    }).select("+password");

    expect(user).not.toBeNull();
    expect(user.password).not.toBe(candidate.password);

    expect(user.role).toBe(ROLES.CANDIDATE);
    expect(user.isEmailVerified).toBe(false);

    const verificationToken = await EmailVerificationToken.findOne({
      userId: user._id,
    });

    expect(verificationToken).not.toBeNull();
    expect(verificationToken.tokenHash).toEqual(expect.any(String));
  });

  test("registers a company admin account", async () => {
    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      {
        username: "company_admin_test",
        email: "company.admin.test@example.com",
        password: "Password123",
        role: ROLES.OWNER,
      },
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "Company admin registration successful",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        email: "company.admin.test@example.com",
        role: ROLES.OWNER,
      }),
    );

    const user = await User.findOne({
      email: "company.admin.test@example.com",
    });

    expect(user.role).toBe(ROLES.OWNER);
    expect(user.isEmailVerified).toBe(false);
  });

  test("rejects an invalid registration payload", async () => {
    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      {
        username: "ab",
        email: "invalid-email",
        password: "weak",
      },
      400,
    );

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(response.body.errors.length).toBeGreaterThan(0);

    expect(await User.countDocuments()).toBe(0);
  });

  test("rejects public registration with recruiter role", async () => {
    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      {
        username: "recruiter_public",
        email: "recruiter.public@example.com",
        password: "Password123",
        role: ROLES.RECRUITER,
      },
      400,
    );

    expect(response.body.success).toBe(false);

    expect(await User.countDocuments()).toBe(0);
  });

  test("rejects duplicate email for a verified account", async () => {
    await User.create({
      username: "duplicate_email_user",
      email: "duplicate.email@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
    });

    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      {
        username: "another_duplicate_email_user",
        email: "duplicate.email@example.com",
        password: "Password123",
        role: ROLES.CANDIDATE,
      },
      409,
    );

    expect(response.body.message).toBe("Email already exists");
  });

  test("rejects duplicate username for a different email", async () => {
    await User.create({
      username: "duplicate_username",
      email: "duplicate.username.one@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
    });

    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/register",
      {
        username: "duplicate_username",
        email: "duplicate.username.two@example.com",
        password: "Password123",
        role: ROLES.CANDIDATE,
      },
      409,
    );

    expect(response.body.message).toBe("Username already exists");
  });

  test("prevents login before email verification", async () => {
    const agent = createTestAgent();

    const candidate = {
      username: "unverified_candidate",
      email: "unverified.candidate@example.com",
      password: "Password123",
    };

    await postWithCsrf(agent, "/api/v1/auth/register", candidate, 201);

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/login",
      {
        email: candidate.email,
        password: candidate.password,
      },
      403,
    );

    expect(response.body.message).toBe(
      "Please verify your email before logging in",
    );
  });

  test("logs in a verified candidate and creates auth cookies plus refresh session", async () => {
    const candidate = {
      username: "verified_candidate_login",
      email: "verified.candidate.login@example.com",
      password: "Password123",
    };

    const user = await User.create({
      ...candidate,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
    });

    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/login",
      {
        email: candidate.email,
        password: candidate.password,
      },
      200,
    );

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: candidate.email,
          role: ROLES.CANDIDATE,
        }),
      }),
    );

    expect(response.body.data.accessToken).toBeUndefined();
    expect(response.body.data.refreshToken).toBeUndefined();

    const cookies = getSetCookies(response);

    const accessToken = getCookieValue(cookies, getAccessTokenCookieName());

    const refreshToken = getCookieValue(cookies, getRefreshTokenCookieName());

    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    const storedSessions = await AuthSession.find({
      userId: user._id,
    }).select("+refreshTokenHash");

    expect(storedSessions).toHaveLength(1);

    const storedSession = storedSessions[0];

    expect(storedSession.sessionId).toEqual(expect.any(String));

    expect(storedSession.userId.toString()).toBe(user._id.toString());

    expect(storedSession.refreshTokenHash).toBe(hashToken(refreshToken));

    expect(storedSession.refreshTokenHash).not.toBe(refreshToken);

    expect(storedSession.revokedAt).toBeNull();
    expect(storedSession.revokedReason).toBeNull();

    expect(storedSession.expiresAt).toBeInstanceOf(Date);
    expect(storedSession.lastUsedAt).toBeInstanceOf(Date);
  });

  test("rejects incorrect login credentials", async () => {
    const candidate = {
      username: "wrong_password_candidate",
      email: "wrong.password.candidate@example.com",
      password: "Password123",
    };

    await User.create({
      ...candidate,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
    });

    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/login",
      {
        email: candidate.email,
        password: "WrongPassword123",
      },
      401,
    );

    expect(response.body.message).toBe("Invalid email or password");
  });

  test("rejects login for deactivated user", async () => {
    await User.create({
      username: "inactive_user",
      email: "inactive.user@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: false,
    });

    const agent = createTestAgent();

    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/login",
      {
        email: "inactive.user@example.com",
        password: "Password123",
      },
      403,
    );

    expect(response.body.message).toBe("This account has been deactivated");
  });
});
