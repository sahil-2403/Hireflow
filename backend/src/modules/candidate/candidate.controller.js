import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as candidateService from "./candidate.service.js";

const createCandidateProfile = asyncHandler(async (req, res) => {
  const result = await candidateService.createCandidateProfile(
    req.user.id,
    req.body,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result.message, result.profile));
});

const getMyCandidateProfile = asyncHandler(async (req, res) => {
  const profile = await candidateService.getMyCandidateProfile(req.user.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Candidate profile fetched successfully", profile),
    );
});

const updateCandidateProfile = asyncHandler(async (req, res) => {
  const result = await candidateService.updateCandidateProfile(
    req.user.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.profile));
});

const uploadCandidateResume = asyncHandler(async (req, res) => {
  const result = await candidateService.uploadCandidateResume(
    req.user.id,
    req.file,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.profile));
});

export {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
};
