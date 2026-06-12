import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as authService from "./auth.service.js";

const loginUser = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
      verificationUrl: result.verificationUrl,
    }),
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);

  return res.status(200).json(
    new ApiResponse(200, result.message, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }),
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  const result = await authService.logoutUser(
    req.user.id,
    req.body.refreshToken,
  );

  return res.status(200).json(new ApiResponse(200, result.message));
});

const logoutAllSessions = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllSessions(req.user.id);

  return res.status(200).json(new ApiResponse(200, result.message));
});

export {
  registerCandidate,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllSessions,
};
