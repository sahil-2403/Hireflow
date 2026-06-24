import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";
import ApiError from "../../shared/errors/ApiError.js";

import * as applicationService from "./application.service.js";

const applyToJob = asyncHandler(async (req, res) => {
  const result = await applicationService.applyToJob(
    req.user.id,
    req.params.jobId,
    req.body,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result.message, result.application));
});

const listMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listMyApplications(
    req.user.id,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Applications fetched successfully", result));
});

const listManagedApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listManagedApplications(
    req.user.id,
    req.user.role,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Managed applications fetched successfully", result),
    );
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = await applicationService.updateApplicationStatus(
    req.user.id,
    req.user.role,
    req.params.applicationId,
    req.body.status,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.application));
});

const viewManagedApplicationResume = asyncHandler(async (req, res) => {
  const resume = await applicationService.getManagedApplicationResume(
    req.user.id,
    req.user.role,
    req.params.applicationId,
  );

  const resumeResponse = await fetch(resume.resumeUrl);

  if (!resumeResponse.ok) {
    throw new ApiError(502, "Unable to load resume file");
  }

  const arrayBuffer = await resumeResponse.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader("Content-Disposition", `inline; filename="${resume.fileName}"`);

  res.setHeader("Content-Length", buffer.length);

  return res.status(200).send(buffer);
});

export {
  applyToJob,
  listMyApplications,
  listManagedApplications,
  updateApplicationStatus,
  viewManagedApplicationResume,
};
