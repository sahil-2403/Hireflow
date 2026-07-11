import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as recommendationService from "./recommendation.service.js";

const listRecommendedJobs = asyncHandler(async (req, res) => {
  const result = await recommendationService.listRecommendedJobs(
    req.user.id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Recommended jobs fetched successfully", result),
    );
});

const getRecommendedJobMatch = asyncHandler(async (req, res) => {
  const result = await recommendationService.getRecommendedJobMatch(
    req.user.id,
    req.params.jobId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Job match fetched successfully", result));
});

export { listRecommendedJobs, getRecommendedJobMatch };
