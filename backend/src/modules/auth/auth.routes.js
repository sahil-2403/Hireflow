import express from "express";

import validate from "../../shared/middleware/validate.js";
import authenticate from "../../shared/middleware/authenticate.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";
import authorize from "../../shared/middleware/authorize.js";
import { ROLES } from "../../config/constants.js";
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
 *     tags:
 *       - Auth
 *     operationId: getCsrfToken
 *     summary: Generate a CSRF token
 *     description: |
 *       Creates an HttpOnly CSRF cookie and returns the matching token
 *       in the response body.
 *
 *       Send the returned token in the `X-CSRF-Token` header for every
 *       POST, PUT, PATCH, and DELETE request.
 *     responses:
 *       "200":
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CsrfTokenData"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: CSRF token generated successfully
 *               data:
 *                 csrfToken: 5d26af9b760b03c33e9948eae1dc6b88eb29304ea5a159ad1d09cb8e4cf9c7af
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/csrf-token", getCsrfToken);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: registerUser
 *     summary: Register a candidate or company-admin account
 *     description: |
 *       Creates a public Hireflow account and sends an email-verification
 *       link.
 *
 *       Public registration supports `candidate` and `owner`.
 *       The owner role is displayed as company admin in the user interface.
 *
 *       The `role` field is optional and defaults to `candidate`.
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: "^[a-zA-Z0-9_]+$"
 *                 example: sahil_24
 *               email:
 *                 type: string
 *                 format: email
 *                 example: candidate@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 writeOnly: true
 *                 example: Password123
 *                 description: Must contain uppercase, lowercase, and numeric characters
 *               role:
 *                 type: string
 *                 enum:
 *                   - candidate
 *                   - owner
 *                 default: candidate
 *                 example: candidate
 *     responses:
 *       "201":
 *         description: |
 *           Registration completed and a verification email was sent.
 *           An existing matching unverified account may receive a new
 *           verification email.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/RegistrationData"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Candidate registration successful. Please check your email to verify your account.
 *               data:
 *                 userId: 507f1f77bcf86cd799439011
 *                 email: candidate@example.com
 *                 role: candidate
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "409":
 *         $ref: "#/components/responses/Conflict"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/register", authLimiter, validate(registerSchema), registerUser);

/**
 * @openapi
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - Auth
 *     operationId: verifyEmail
 *     summary: Verify an account email address
 *     description: |
 *       Verifies a candidate or company-admin account using the token
 *       sent in the verification email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Email-verification token received by email
 *         schema:
 *           type: string
 *           minLength: 1
 *     responses:
 *       "200":
 *         description: Email verified or already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Email verified successfully
 *               data: null
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @openapi
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: resendVerificationEmail
 *     summary: Resend an email-verification link
 *     description: |
 *       Returns the same generic response whether or not an eligible
 *       unverified account exists. This prevents account enumeration.
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: candidate@example.com
 *     responses:
 *       "200":
 *         description: Generic verification-email response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: If an unverified account with this email exists, a verification email has been sent.
 *               data: null
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: loginUser
 *     summary: Log in to Hireflow
 *     description: |
 *       Validates the account credentials and creates a stable
 *       authentication session.
 *
 *       A successful response sets two HttpOnly cookies:
 *
 *       - Access-token cookie scoped to `/api/v1`
 *       - Refresh-token cookie scoped to `/api/v1/auth`
 *
 *       Tokens are not returned in the JSON response.
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: candidate@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 1
 *                 writeOnly: true
 *                 example: Password123
 *     responses:
 *       "200":
 *         description: |
 *           Login successful. Access and refresh cookies are included
 *           through `Set-Cookie` response headers.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       required:
 *                         - user
 *                       properties:
 *                         user:
 *                           $ref: "#/components/schemas/AuthUser"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Login successful
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   username: sahil_24
 *                   email: candidate@example.com
 *                   role: candidate
 *                   profilePhotoUrl: null
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/login", authLimiter, validate(loginSchema), loginUser);

/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: refreshAccessToken
 *     summary: Rotate the current session tokens
 *     description: |
 *       Reads the refresh token from the HttpOnly refresh-token cookie.
 *
 *       The request has no JSON body. A successful request rotates the
 *       existing refresh token and sets new access and refresh cookies.
 *
 *       Reuse of a previously rotated refresh token revokes the affected
 *       session and requires the user to log in again.
 *     security:
 *       - refreshCookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: |
 *           Tokens rotated successfully. New authentication cookies are
 *           included through `Set-Cookie` response headers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Token refreshed successfully
 *               data: null
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: logoutUser
 *     summary: Log out the current device session
 *     description: |
 *       Revokes the current stable authentication session when a valid
 *       access or refresh cookie identifies it.
 *
 *       The request has no JSON body. Authentication cookies are cleared
 *       even when the supplied cookies are already missing or invalid,
 *       making this operation safe to repeat.
 *     security:
 *       - refreshCookieAuth: []
 *         csrfToken: []
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Current authentication cookies cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Logged out successfully
 *               data: null
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: logoutAllSessions
 *     summary: Log out from all active devices
 *     description: |
 *       Revokes all existing authentication sessions for the current
 *       account and clears the current browser's authentication cookies.
 *
 *       This invalidates existing access and refresh tokens using the
 *       account authentication version.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Every existing account session was revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Logged out from all devices successfully
 *               data: null
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/logout-all", authenticate, logoutAllSessions);

/**
 * @openapi
 * /api/v1/auth/me/profile-photo:
 *   patch:
 *     tags:
 *       - Auth
 *       - Uploads
 *     operationId: uploadProfilePhoto
 *     summary: Upload or replace the authenticated user's profile photo
 *     description: |
 *       Accepts one JPEG, PNG, or WebP image with a maximum size of 2 MB.
 *       Replacing an existing photo also removes the previous Cloudinary
 *       asset.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP image up to 2 MB
 *     responses:
 *       "200":
 *         description: Profile photo uploaded or replaced
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       required:
 *                         - user
 *                       properties:
 *                         user:
 *                           $ref: "#/components/schemas/AuthUser"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     tags:
 *       - Auth
 *       - Uploads
 *     operationId: deleteProfilePhoto
 *     summary: Remove the authenticated user's profile photo
 *     description: |
 *       Clears the stored profile-photo fields and removes the associated
 *       Cloudinary image when one exists.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Profile photo removed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       required:
 *                         - user
 *                       properties:
 *                         user:
 *                           $ref: "#/components/schemas/AuthUser"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Profile photo removed successfully
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   username: sahil_24
 *                   email: candidate@example.com
 *                   role: candidate
 *                   profilePhotoUrl: null
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.delete("/me/profile-photo", authenticate, deleteProfilePhoto);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     operationId: forgotPassword
 *     summary: Request a password-reset email
 *     description: |
 *       Returns the same generic response whether or not an account
 *       exists for the supplied email address. This prevents account
 *       enumeration.
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: candidate@example.com
 *     responses:
 *       "200":
 *         description: Generic password-reset response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: If an account with this email exists, a password reset link has been sent.
 *               data: null
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: resetPassword
 *     summary: Reset an account password
 *     description: |
 *       Updates the account password using a valid password-reset token.
 *
 *       All existing authentication sessions are revoked after a
 *       successful password reset, and the user must log in again.
 *     security:
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Password-reset token received by email
 *         schema:
 *           type: string
 *           minLength: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 writeOnly: true
 *                 example: NewPassword123
 *                 description: Must contain uppercase, lowercase, and numeric characters
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 1
 *                 writeOnly: true
 *                 example: NewPassword123
 *     responses:
 *       "200":
 *         description: Password updated and existing sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Password reset successfully. Please log in again.
 *               data: null
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: getAuthenticatedUser
 *     summary: Get the authenticated user
 *     description: |
 *       Validates the access-token cookie, stable session, account state,
 *       and authentication version before returning the current identity.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Current authenticated user returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AuthUser"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Current user fetched successfully
 *               data:
 *                 id: 507f1f77bcf86cd799439011
 *                 username: sahil_24
 *                 email: candidate@example.com
 *                 role: candidate
 *                 profilePhotoUrl: null
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/me", authenticate, (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

export default router;
