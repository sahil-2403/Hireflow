import express from "express";

import validate from "../../shared/middleware/validate.js";
import authenticate from "../../shared/middleware/authenticate.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";
import authorize from "../../shared/middleware/authorize.js";
import { ROLES } from "../../config/constants.js";

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from "./auth.validation.js";
import {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
} from "./auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerCandidate);

router.get("/verify-email/:token", verifyEmail);

router.post("/login", validate(loginSchema), loginUser);

router.post("/refresh-token", validate(refreshTokenSchema), refreshAccessToken);

router.get("/me", authenticate, (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

router.post("/logout", authenticate, validate(logoutSchema), logoutUser);

router.post("/logout-all", authenticate, logoutAllSessions);

export default router;
