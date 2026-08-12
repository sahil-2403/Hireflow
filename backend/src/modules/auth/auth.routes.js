import express from "express";

import validate from "../../shared/middleware/validate.js";
import authenticate from "../../shared/middleware/authenticate.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";
import { authLimiter } from "../../shared/middleware/rateLimiters.js";
import { uploadProfilePhoto as uploadProfilePhotoFile } from "../../shared/middleware/upload.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "./auth.validation.js";

import {
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
  getCsrfToken,
} from "./auth.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/csrf-token:
 *   get:
 *     tags: [Auth]
 *     summary: Get a CSRF token
 *     responses:
 *       "200":
 *         description: CSRF token generated successfully
 */
router.get("/csrf-token", getCsrfToken);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a candidate or company admin
 *     security:
 *       - csrfToken: []
 *     responses:
 *       "201":
 *         description: Account registered and verification email sent
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "409":
 *         $ref: "#/components/responses/Conflict"
 */
router.post("/register", authLimiter, validate(registerSchema), registerUser);

/**
 * @openapi
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify an email address
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Email verified successfully
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @openapi
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the verification email
 *     security:
 *       - csrfToken: []
 *     responses:
 *       "200":
 *         description: Verification request processed
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
 *     tags: [Auth]
 *     summary: Log in to Hireflow
 *     description: Sets short-lived access and longer-lived refresh JWTs in HttpOnly cookies.
 *     security:
 *       - csrfToken: []
 *     responses:
 *       "200":
 *         description: Login successful
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.post("/login", authLimiter, validate(loginSchema), loginUser);

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token
 *     description: Verifies the refresh-token cookie and issues a new access-token cookie. The refresh token is not rotated.
 *     security:
 *       - refreshCookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Access token refreshed successfully
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current browser
 *     description: Clears the access and refresh cookies for the current browser.
 *     security:
 *       - csrfToken: []
 *     responses:
 *       "200":
 *         description: Logged out successfully
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Log out from all devices
 *     description: Increments the user's token version so all previously issued access and refresh tokens become invalid.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Logged out from all devices successfully
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post("/logout-all", authenticate, logoutAllSessions);

/**
 * @openapi
 * /api/v1/auth/me/profile-photo:
 *   patch:
 *     tags: [Auth, Uploads]
 *     summary: Upload or replace the current user's profile photo
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Profile photo updated
 */
router.patch(
  "/me/profile-photo",
  authenticate,
  uploadProfilePhotoFile,
  uploadProfilePhoto,
);

/**
 * @openapi
 * /api/v1/auth/me/profile-photo:
 *   delete:
 *     tags: [Auth, Uploads]
 *     summary: Remove the current user's profile photo
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Profile photo removed
 */
router.delete("/me/profile-photo", authenticate, deleteProfilePhoto);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     security:
 *       - csrfToken: []
 *     responses:
 *       "200":
 *         description: Password reset request processed
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
 *     tags: [Auth]
 *     summary: Reset an account password
 *     description: Updates the password and increments tokenVersion, invalidating previously issued tokens.
 *     security:
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Password reset successfully
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
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
 *     tags: [Auth]
 *     summary: Get the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Current authenticated user
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get("/me", authenticate, (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

export default router;
