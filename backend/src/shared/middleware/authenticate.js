import ApiError from "../errors/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../../modules/auth/auth.model.js";

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token missing");
  }

  const token = authHeader.split(" ")[1];

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.sub);

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  next();
});

export default authenticate;
