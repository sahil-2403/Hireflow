import User from "./auth.model.js";
import PasswordResetToken from "./passwordResetToken.model.js";
import EmailVerificationToken from "./emailVerificationToken.model.js";
import sendEmail from "../../shared/services/email.service.js";
import ApiError from "../../shared/errors/ApiError.js";
import { ROLES } from "../../config/constants.js";
import { generateRandomToken, hashToken } from "../../shared/utils/token.js";
import RefreshToken from "./refreshToken.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt.js";

import crypto from "node:crypto";

const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS =
  Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS) || 24;

const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY) || 7;

const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES =
  Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 15;

const resetPassword = async (token, password) => {
  const tokenHash = hashToken(token);

  const storedToken = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  const user = await User.findById(storedToken.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.password = password;
  await user.save();

  await Promise.all([
    PasswordResetToken.deleteMany({
      userId: user._id,
    }),
    RefreshToken.deleteMany({
      userId: user._id,
    }),
  ]);

  return {
    message: "Password reset successfully. Please log in again.",
  };
};

const forgotPassword = async (email) => {
  const genericMessage =
    "If an account with this email exists, a password reset link has been sent.";

  const user = await User.findOne({ email });

  if (!user) {
    return {
      message: genericMessage,
    };
  }

  await PasswordResetToken.deleteMany({
    userId: user._id,
  });

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail(user, rawToken);

  return {
    message: genericMessage,
  };
};

const logoutAllSessions = async (userId) => {
  await RefreshToken.deleteMany({
    userId,
  });

  return {
    message: "Logged out from all devices successfully",
  };
};

const logoutUser = async (userId, refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  const deletedToken = await RefreshToken.findOneAndDelete({
    userId,
    tokenHash,
  });

  if (!deletedToken) {
    throw new ApiError(404, "Session not found");
  }

  return {
    message: "Logged out successfully",
  };
};

const createRefreshToken = async (user) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    jti: crypto.randomUUID(),
  };

  const refreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  return refreshToken;
};

const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    userId: user._id,
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  await RefreshToken.deleteOne({
    _id: storedToken._id,
  });

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const newRefreshToken = await createRefreshToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    message: "Token refreshed successfully",
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = await createRefreshToken(user);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
    message: "Login successful",
  };
};

const verifyEmail = async (token) => {
  const tokenHash = hashToken(token);

  const verificationToken = await EmailVerificationToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!verificationToken) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  const user = await User.findById(verificationToken.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    await EmailVerificationToken.deleteMany({ userId: user._id });

    return {
      message: "Email is already verified",
    };
  }

  user.isEmailVerified = true;
  await user.save();

  await EmailVerificationToken.deleteMany({ userId: user._id });

  return {
    message: "Email verified successfully",
  };
};

const createEmailVerificationToken = async (userId) => {
  await EmailVerificationToken.deleteMany({ userId });

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await EmailVerificationToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
};

const registerCandidate = async ({ username, email, password }) => {
  const existingUsername = await User.findOne({ username });

  if (existingUsername && existingUsername.email !== email) {
    throw new ApiError(409, "Username already exists");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ApiError(409, "Email already exists");
    }

    const verificationToken = await createEmailVerificationToken(
      existingUser._id,
    );

    await sendVerificationEmail(existingUser, verificationToken);

    return {
      userId: existingUser._id,
      email: existingUser.email,
      message: "Verification email resent. Please check your inbox.",
    };
  }

  const user = await User.create({
    username,
    email,
    password,
    role: ROLES.CANDIDATE,
  });

  const verificationToken = await createEmailVerificationToken(user._id);

  await sendVerificationEmail(user, verificationToken);

  return {
    userId: user._id,
    email: user.email,
    message:
      "Registration successful. Please check your email to verify your account.",
  };
};

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your HireFlow email",
    html: `
      <h2>Welcome to HireFlow</h2>
      <p>Hello ${user.username},</p>
      <p>Verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify email</a></p>
      <p>This link expires in ${EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS} hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your HireFlow password",
    html: `
      <h2>HireFlow password reset</h2>
      <p>Hello ${user.username},</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in ${PASSWORD_RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
};

const resendVerificationEmail = async (email) => {
  const genericMessage =
    "If an unverified account with this email exists, a verification email has been sent.";

  const user = await User.findOne({ email });

  if (!user || user.isEmailVerified) {
    return {
      message: genericMessage,
    };
  }

  const verificationToken = await createEmailVerificationToken(user._id);

  await sendVerificationEmail(user, verificationToken);

  return {
    message: genericMessage,
  };
};

export {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
};
