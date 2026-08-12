import ApiError from "../errors/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

import User from "../../modules/auth/auth.model.js";
import { getAccessTokenCookieName } from "../../modules/auth/auth.cookie.js";

const authenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies?.[getAccessTokenCookieName()];

  if (!accessToken) {
    throw new ApiError(401, "Authentication token missing");
  }

  const decoded = verifyAccessToken(accessToken);

  if (!decoded?.userId) {
    throw new ApiError(401, "Invalid authentication token");
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  if (Number(decoded.tokenVersion) !== Number(user.tokenVersion ?? 0)) {
    throw new ApiError(401, "This session has been revoked");
  }

  req.user = {
    username: user.username,
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl,
  };

  next();
});

export default authenticate;
