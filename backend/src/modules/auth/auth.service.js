import User from "./auth.model.js";
import EmailVerificationToken from "./emailVerificationToken.model.js";
import ApiError from "../../shared/errors/ApiError.js";
import { ROLES } from "../../config/constants.js";
import { generateRandomToken, hashToken } from "../../shared/utils/token.js";
import RefreshToken from "./refreshToken.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt.js";

const VERIFICATION_TOKEN_EXPIRY_HOURS =
  Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS) || 24;

const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY) || 7;

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
    Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
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

    return {
      userId: existingUser._id,
      email: existingUser.email,
      verificationUrl: `/api/v1/auth/verify-email/${verificationToken}`,
      message: "Verification email resent. Please verify your email.",
    };
  }

  const user = await User.create({
    username,
    email,
    password,
    role: ROLES.CANDIDATE,
  });

  const verificationToken = await createEmailVerificationToken(user._id);

  return {
    userId: user._id,
    email: user.email,
    verificationUrl: `/api/v1/auth/verify-email/${verificationToken}`,
    message: "Registration successful. Please verify your email.",
  };
};

export {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
};
