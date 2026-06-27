import express from "express";

import validate from "../../shared/middleware/validate.js";
import authenticate from "../../shared/middleware/authenticate.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";
import authorize from "../../shared/middleware/authorize.js";
import { ROLES } from "../../config/constants.js";
import { authLimiter } from "../../shared/middleware/rateLimiters.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "./auth.validation.js";

import {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  getCsrfToken,
} from "./auth.controller.js";

const router = express.Router();

router.get("/csrf-token", getCsrfToken);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a candidate account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: sahil_24
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sahil@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Account already exists
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerCandidate,
);

/**
 * @openapi
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify a candidate email address
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @openapi
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend an email verification link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sahil@example.com
 *     responses:
 *       200:
 *         description: Generic verification email response
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many requests
 */
router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmail,
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in to HireFlow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account unavailable
 */
router.post("/login", authLimiter, validate(loginSchema), loginUser);

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Rotate a refresh token and issue new tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out the current device session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Session not found
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out from every active device
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *       401:
 *         description: Authentication required
 */
router.post("/logout-all", authenticate, logoutAllSessions);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password-reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic password-reset response
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many requests
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

/**
 * @openapi
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset an account password
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation failed or token is invalid
 */
router.post(
  "/reset-password/:token",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user returned
 *       401:
 *         description: Authentication required
 */
router.get("/me", authenticate, (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

export default router;
