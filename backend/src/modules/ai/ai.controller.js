import ApiResponse from "../../shared/responses/ApiResponse.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  analyzeMyCandidateResume,
  getMyCandidateResumeAnalysis,
  checkMyCandidateJobResumeFit,
} from "./ai.service.js";

const getAuthUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const analyzeCandidateResume = asyncHandler(async (req, res) => {
  const result = await analyzeMyCandidateResume(getAuthUserId(req));

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Resume Insights already available for this resume"
    : "AI Resume Insights generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

const getCandidateResumeAnalysis = asyncHandler(async (req, res) => {
  const result = await getMyCandidateResumeAnalysis(getAuthUserId(req));

  return res
    .status(200)
    .json(
      new ApiResponse(200, "AI Resume Insights fetched successfully", result),
    );
});

const checkCandidateJobResumeFit = asyncHandler(async (req, res) => {
  const result = await checkMyCandidateJobResumeFit({
    userId: getAuthUserId(req),
    jobId: req.params.jobId,
  });

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Resume Fit already available for this job"
    : "AI Resume Fit generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

export {
  analyzeCandidateResume,
  checkCandidateJobResumeFit,
  getCandidateResumeAnalysis,
};
