import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import {
  setAccessTokenCookie,
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenCookieName,
} from "./auth.cookie.js";

import {
  generateCsrfToken,
  setCsrfCookie,
} from "../../shared/security/csrf.js";

import * as authService from "./auth.service.js";

const loginUser = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      user: result.user,
    }),
  );
});

const loginWithGoogle = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle(req.body);

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      user: result.user,
    }),
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const registerUser = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  return res.status(201).json(
    new ApiResponse(201, result.message, {
      userId: result.userId,
      email: result.email,
      role: result.role,
    }),
  );
});

const registerWithGoogle = asyncHandler(async (req, res) => {
  const result = await authService.registerWithGoogle(req.body);

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(201).json(
    new ApiResponse(201, result.message, {
      user: result.user,
    }),
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[getRefreshTokenCookieName()];
  const result = await authService.refreshAccessToken(refreshToken);

  setAccessTokenCookie(res, result.accessToken);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const logoutUser = asyncHandler(async (req, res) => {
  const result = await authService.logoutUser();

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const logoutAllSessions = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllSessions(req.user.id);

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const result = await authService.uploadProfilePhoto(req.user.id, req.file);

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      user: result.user,
    }),
  );
});

const deleteProfilePhoto = asyncHandler(async (req, res) => {
  const result = await authService.deleteProfilePhoto(req.user.id);

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      user: result.user,
    }),
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(
    req.params.token,
    req.body.password,
  );

  return res.status(200).json(new ApiResponse(200, result.message));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.body.email);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const getCsrfToken = asyncHandler(async (req, res) => {
  const csrfToken = generateCsrfToken();

  setCsrfCookie(res, csrfToken);

  return res.status(200).json(
    new ApiResponse(200, "CSRF token generated successfully", {
      csrfToken,
    }),
  );
});

export {
  registerUser,
  registerWithGoogle,
  verifyEmail,
  loginUser,
  loginWithGoogle,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  uploadProfilePhoto,
  deleteProfilePhoto,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  getCsrfToken,
};
