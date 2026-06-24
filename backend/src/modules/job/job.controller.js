import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as jobService from "./job.service.js";

const createJob = asyncHandler(async (req, res) => {
  const result = await jobService.createJob(
    req.user.id,
    req.user.role,
    req.body,
  );

  return res.status(201).json(new ApiResponse(201, result.message, result.job));
});

const updateJob = asyncHandler(async (req, res) => {
  const result = await jobService.updateJob(
    req.user.id,
    req.user.role,
    req.params.jobId,
    req.body,
  );

  return res.status(200).json(new ApiResponse(200, result.message, result.job));
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const result = await jobService.updateJobStatus(
    req.user.id,
    req.user.role,
    req.params.jobId,
    req.body.status,
  );

  return res.status(200).json(new ApiResponse(200, result.message, result.job));
});

const listPublicJobs = asyncHandler(async (req, res) => {
  const result = await jobService.listPublicJobs(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Jobs fetched successfully", result));
});

const getPublicJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getPublicJobById(req.params.jobId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Job fetched successfully", job));
});

const listManagedJobs = asyncHandler(async (req, res) => {
  const result = await jobService.listManagedJobs(
    req.user.id,
    req.user.role,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Managed jobs fetched successfully", result));
});

const getManagedJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getManagedJobById(
    req.user.id,
    req.user.role,
    req.params.jobId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Managed job fetched successfully", job));
});

export {
  createJob,
  updateJob,
  updateJobStatus,
  listPublicJobs,
  getPublicJobById,
  listManagedJobs,
  getManagedJobById,
};
