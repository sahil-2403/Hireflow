import { vi } from "vitest";

vi.mock("../../src/shared/services/email.service.js", () => ({
  default: vi.fn().mockResolvedValue({
    messageId: "test-email-id",
  }),
}));

vi.mock("../../src/modules/auth/googleAuth.service.js", () => ({
  verifyGoogleCredential: vi.fn(),
}));

import User from "../../src/modules/auth/auth.model.js";
import PasswordResetToken from "../../src/modules/auth/passwordResetToken.model.js";
import EmailVerificationToken from "../../src/modules/auth/emailVerificationToken.model.js";
import sendEmail from "../../src/shared/services/email.service.js";
import { verifyGoogleCredential } from "../../src/modules/auth/googleAuth.service.js";
import { AUTH_PROVIDERS, ROLES } from "../../src/config/constants.js";

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

const candidateGoogleIdentity = {
  googleId: "google-candidate-123",
  email: "google.candidate@example.com",
  name: "Google Candidate",
  profilePhotoUrl: "https://example.com/google-candidate.jpg",
};

const companyGoogleIdentity = {
  googleId: "google-company-456",
  email: "google.company@example.com",
  name: "Google Company Admin",
  profilePhotoUrl: null,
};

describe("Google Authentication API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("registers and authenticates a Google candidate", async () => {
    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const agent = createTestAgent();
    const response = await postWithCsrf(
      agent,
      "/api/v1/auth/google/register",
      {
        credential: "valid-google-credential",
        role: ROLES.CANDIDATE,
      },
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        email: candidateGoogleIdentity.email,
        role: ROLES.CANDIDATE,
        profilePhotoUrl: candidateGoogleIdentity.profilePhotoUrl,
      }),
    );

    const user = await User.findOne({
      email: candidateGoogleIdentity.email,
    }).select("+password");

    expect(user).not.toBeNull();
    expect(user.authProvider).toBe(AUTH_PROVIDERS.GOOGLE);
    expect(user.googleId).toBe(candidateGoogleIdentity.googleId);
    expect(user.password).toBeUndefined();
    expect(user.isEmailVerified).toBe(true);
    expect(user.role).toBe(ROLES.CANDIDATE);
    expect(user.username).toMatch(/^google_candidate_[a-f0-9]{8}$/);

    expect(
      await EmailVerificationToken.countDocuments({ userId: user._id }),
    ).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();

    const cookies = getSetCookies(response);

    expect(
      getCookieValue(cookies, getAccessTokenCookieName()),
    ).toEqual(expect.any(String));
    expect(
      getCookieValue(cookies, getRefreshTokenCookieName()),
    ).toEqual(expect.any(String));
  });

  test("registers a Google company admin", async () => {
    verifyGoogleCredential.mockResolvedValueOnce(companyGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/register",
      {
        credential: "valid-google-company-credential",
        role: ROLES.OWNER,
      },
      201,
    );

    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        email: companyGoogleIdentity.email,
        role: ROLES.OWNER,
      }),
    );

    const user = await User.findOne({
      email: companyGoogleIdentity.email,
    });

    expect(user.authProvider).toBe(AUTH_PROVIDERS.GOOGLE);
    expect(user.role).toBe(ROLES.OWNER);
    expect(user.isEmailVerified).toBe(true);
  });

  test("rejects Google registration when the email already belongs to a local account", async () => {
    await User.create({
      username: "existing_local_user",
      email: candidateGoogleIdentity.email,
      password: "Password123",
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/register",
      {
        credential: "valid-google-credential",
        role: ROLES.CANDIDATE,
      },
      409,
    );

    expect(response.body.message).toContain(
      "An account already exists with this email",
    );
    expect(await User.countDocuments()).toBe(1);
  });

  test("rejects registering the same Google account twice", async () => {
    await User.create({
      username: "existing_google_user",
      email: candidateGoogleIdentity.email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId: candidateGoogleIdentity.googleId,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/register",
      {
        credential: "valid-google-credential",
        role: ROLES.CANDIDATE,
      },
      409,
    );

    expect(response.body.message).toContain("already registered");
  });

  test("logs in an existing Google user", async () => {
    await User.create({
      username: "google_login_user",
      email: candidateGoogleIdentity.email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId: candidateGoogleIdentity.googleId,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/login",
      {
        credential: "valid-google-credential",
      },
      200,
    );

    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        email: candidateGoogleIdentity.email,
        role: ROLES.CANDIDATE,
      }),
    );

    const cookies = getSetCookies(response);
    expect(
      getCookieValue(cookies, getAccessTokenCookieName()),
    ).toEqual(expect.any(String));
    expect(
      getCookieValue(cookies, getRefreshTokenCookieName()),
    ).toEqual(expect.any(String));
  });

  test("rejects Google login when the Google account is not registered", async () => {
    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/login",
      {
        credential: "valid-google-credential",
      },
      401,
    );

    expect(response.body.message).toContain("not registered");
  });

  test("rejects Google login for a deactivated account", async () => {
    await User.create({
      username: "inactive_google_user",
      email: candidateGoogleIdentity.email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId: candidateGoogleIdentity.googleId,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: false,
    });

    verifyGoogleCredential.mockResolvedValueOnce(candidateGoogleIdentity);

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/login",
      {
        credential: "valid-google-credential",
      },
      403,
    );

    expect(response.body.message).toBe("This account has been deactivated");
  });

  test("directs Google users away from password login", async () => {
    await User.create({
      username: "google_password_user",
      email: candidateGoogleIdentity.email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId: candidateGoogleIdentity.googleId,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/login",
      {
        email: candidateGoogleIdentity.email,
        password: "Password123",
      },
      401,
    );

    expect(response.body.message).toBe("Please sign in with Google");
  });

  test("does not create password reset tokens for Google-only accounts", async () => {
    const user = await User.create({
      username: "google_reset_user",
      email: candidateGoogleIdentity.email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      googleId: candidateGoogleIdentity.googleId,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
    });

    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/forgot-password",
      {
        email: user.email,
      },
      200,
    );

    expect(response.body.message).toContain("If an account with this email exists");
    expect(
      await PasswordResetToken.countDocuments({ userId: user._id }),
    ).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("rejects invalid Google registration roles before account creation", async () => {
    const response = await postWithCsrf(
      createTestAgent(),
      "/api/v1/auth/google/register",
      {
        credential: "valid-google-credential",
        role: ROLES.RECRUITER,
      },
      400,
    );

    expect(response.body.message).toBe("Validation failed");
    expect(verifyGoogleCredential).not.toHaveBeenCalled();
    expect(await User.countDocuments()).toBe(0);
  });
});
