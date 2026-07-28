import User from "./auth.model.js";
import PasswordResetToken from "./passwordResetToken.model.js";
import EmailVerificationToken from "./emailVerificationToken.model.js";
import sendEmail from "../../shared/services/email.service.js";
import ApiError from "../../shared/errors/ApiError.js";
import { ROLES } from "../../config/constants.js";
import { generateRandomToken, hashToken } from "../../shared/utils/token.js";

import {
  uploadProfilePhotoFile,
  deleteAsset,
} from "../../shared/services/media.service.js";

import {
  SESSION_REVOKE_REASONS,
  createAuthSession,
  rotateAuthSession,
  revokeCurrentAuthSession,
  revokeAllAuthSessions,
} from "./authSession.service.js";

const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS =
  Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS) || 24;

const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES =
  Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 15;

const PUBLIC_REGISTRATION_ROLES = [ROLES.CANDIDATE, ROLES.OWNER];

const buildAuthUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl,
  };
};

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

    revokeAllAuthSessions(user._id, SESSION_REVOKE_REASONS.PASSWORD_RESET),
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
  await revokeAllAuthSessions(userId, SESSION_REVOKE_REASONS.USER_LOGOUT_ALL);

  return {
    message: "Logged out from all devices successfully",
  };
};

const logoutUser = async ({ refreshToken, accessToken }) => {
  await revokeCurrentAuthSession({
    refreshToken,
    accessToken,
  });

  return {
    message: "Logged out successfully",
  };
};

const uploadProfilePhoto = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "Profile photo file is required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const oldPublicId = user.profilePhotoPublicId;

  const uploadedAsset = await uploadProfilePhotoFile(file.buffer);

  try {
    user.profilePhotoUrl = uploadedAsset.url;
    user.profilePhotoPublicId = uploadedAsset.publicId;

    await user.save();
  } catch (error) {
    await deleteAsset(uploadedAsset.publicId, "image");

    throw error;
  }

  await deleteAsset(oldPublicId, "image");

  return {
    user: buildAuthUserResponse(user),
    message: "Profile photo uploaded successfully",
  };
};

const deleteProfilePhoto = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const oldPublicId = user.profilePhotoPublicId;

  user.profilePhotoUrl = null;
  user.profilePhotoPublicId = null;

  await user.save();

  await deleteAsset(oldPublicId, "image");

  return {
    user: buildAuthUserResponse(user),
    message: "Profile photo removed successfully",
  };
};

const refreshAccessToken = async (refreshToken) => {
  const result = await rotateAuthSession(refreshToken);

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
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

  const { accessToken, refreshToken } = await createAuthSession(user);

  return {
    user: buildAuthUserResponse(user),
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

const getRegistrationSuccessMessage = (role) => {
  if (role === ROLES.OWNER) {
    return "Company admin registration successful. Please check your email to verify your account.";
  }

  return "Candidate registration successful. Please check your email to verify your account.";
};

const registerUser = async ({
  username,
  email,
  password,
  role = ROLES.CANDIDATE,
}) => {
  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw new ApiError(
      400,
      "Registration role must be either candidate or owner",
    );
  }

  const existingUsername = await User.findOne({ username });

  if (existingUsername && existingUsername.email !== email) {
    throw new ApiError(409, "Username already exists");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ApiError(409, "Email already exists");
    }

    if (existingUser.role !== role) {
      throw new ApiError(
        409,
        "An unverified account already exists with this email. Please verify that account or use a different email.",
      );
    }

    const verificationToken = await createEmailVerificationToken(
      existingUser._id,
    );

    await sendVerificationEmail(existingUser, verificationToken);

    return {
      userId: existingUser._id,
      email: existingUser.email,
      role: existingUser.role,
      message: "Verification email resent. Please check your inbox.",
    };
  }

  const user = await User.create({
    username,
    email,
    password,
    role,
  });

  const verificationToken = await createEmailVerificationToken(user._id);

  await sendVerificationEmail(user, verificationToken);

  return {
    userId: user._id,
    email: user.email,
    role: user.role,
    message: getRegistrationSuccessMessage(user.role),
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
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  uploadProfilePhoto,
  deleteProfilePhoto,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
};
