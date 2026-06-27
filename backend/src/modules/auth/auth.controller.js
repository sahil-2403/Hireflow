import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenCookieName,
} from "./auth.cookie.js";

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

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const registerCandidate = asyncHandler(async (req, res) => {
  const result = await authService.registerCandidate(req.body);

  return res.status(201).json(
    new ApiResponse(201, result.message, {
      userId: result.userId,
      email: result.email,
    }),
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[getRefreshTokenCookieName()];

  const result = await authService.refreshAccessToken(refreshToken);

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.status(200).json(new ApiResponse(200, result.message));
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[getRefreshTokenCookieName()];

  const result = await authService.logoutUser(refreshToken);

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, result.message));
});

const logoutAllSessions = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllSessions(req.user.id);

  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, result.message));
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

export {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
};
