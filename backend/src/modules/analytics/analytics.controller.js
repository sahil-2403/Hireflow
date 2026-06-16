import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as analyticsService from "./analytics.service.js";

const getCompanyOverview = asyncHandler(async (req, res) => {
  const result = await analyticsService.getCompanyOverview(
    req.user.id,
    req.user.role,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Company analytics fetched successfully", result),
    );
});

const getHiringFunnel = asyncHandler(async (req, res) => {
  const result = await analyticsService.getHiringFunnel(
    req.user.id,
    req.user.role,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Hiring funnel fetched successfully", result));
});

const getTopJobs = asyncHandler(async (req, res) => {
  const jobs = await analyticsService.getTopJobs(
    req.user.id,
    req.user.role,
    req.query.limit,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Top jobs fetched successfully", jobs));
});

const getCandidateOverview = asyncHandler(async (req, res) => {
  const result = await analyticsService.getCandidateOverview(req.user.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Candidate analytics fetched successfully", result),
    );
});

export {
  getCompanyOverview,
  getHiringFunnel,
  getTopJobs,
  getCandidateOverview,
};
