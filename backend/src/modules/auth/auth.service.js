import User from "./auth.model.js";
import EmailVerificationToken from "./emailVerificationToken.model.js";
import ApiError from "../../shared/errors/ApiError.js";
import { ROLES } from "../../config/constants.js";
import { generateRandomToken, hashToken } from "../../shared/utils/token.js";

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

const VERIFICATION_TOKEN_EXPIRY_HOURS =
  Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS) || 24;

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

export { registerCandidate, verifyEmail };
