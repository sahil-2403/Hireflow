import express from "express";

import validate from "../../shared/middleware/validate.js";
import { registerSchema } from "./auth.validation.js";
import { registerCandidate, verifyEmail } from "./auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerCandidate);

router.get("/verify-email/:token", verifyEmail);

export default router;
