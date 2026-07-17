import ApiResponse from "../../shared/responses/ApiResponse.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

import {
  analyzeMyCandidateResume,
  checkMyCandidateJobResumeFit,
  generateManagedApplicationInterviewKit,
  getMyCandidateResumeAnalysis,
  reviewManagedApplicationResumeMatch,
} from "./ai.service.js";

import { generateJobPostAssistantSuggestions } from "./aiJobPost.service.js";
import { generateSuggestedShortlist } from "./aiShortlist.service.js";
import { generateCandidateComparison } from "./aiComparison.service.js";

const getAuthUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const reviewApplicationResumeMatch = asyncHandler(async (req, res) => {
  const result = await reviewManagedApplicationResumeMatch({
    userId: getAuthUserId(req),
    role: req.user.role,
    applicationId: req.params.applicationId,
  });

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Resume Match Review already available for this application"
    : "AI Resume Match Review generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

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

const generateJobPostSuggestions = asyncHandler(async (req, res) => {
  const result = await generateJobPostAssistantSuggestions({
    userId: getAuthUserId(req),
    role: req.user.role,
    jobDraft: req.body,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "AI Job Post Assistant suggestions generated successfully",
        result,
      ),
    );
});

const generateApplicationInterviewKit = asyncHandler(async (req, res) => {
  const result = await generateManagedApplicationInterviewKit({
    userId: getAuthUserId(req),
    role: req.user.role,
    applicationId: req.params.applicationId,
  });

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Interview Kit already available for this application"
    : "AI Interview Kit generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

const generateJobSuggestedShortlist = asyncHandler(async (req, res) => {
  const result = await generateSuggestedShortlist({
    userId: getAuthUserId(req),
    role: req.user.role,
    jobId: req.params.jobId,
    requestedLimit: req.body.limit,
  });

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Suggested Shortlist already available for this job"
    : "AI Suggested Shortlist generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

const generateJobCandidateComparison = asyncHandler(async (req, res) => {
  const result = await generateCandidateComparison({
    userId: getAuthUserId(req),
    role: req.user.role,
    jobId: req.params.jobId,
    applicationIds: req.body.applicationIds,
  });

  const statusCode = result.reused ? 200 : 201;

  const message = result.reused
    ? "AI Candidate Comparison already available"
    : "AI Candidate Comparison generated successfully";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, result));
});

export {
  analyzeCandidateResume,
  checkCandidateJobResumeFit,
  generateApplicationInterviewKit,
  generateJobPostSuggestions,
  generateJobSuggestedShortlist,
  getCandidateResumeAnalysis,
  reviewApplicationResumeMatch,
  generateJobCandidateComparison,
};
