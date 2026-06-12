import express from "express";

import validate from "../../shared/middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.validation.js";
import {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
} from "./auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerCandidate);

router.get("/verify-email/:token", verifyEmail);

router.post("/login", validate(loginSchema), loginUser);

router.post("/refresh-token", validate(refreshTokenSchema), refreshAccessToken);

export default router;
