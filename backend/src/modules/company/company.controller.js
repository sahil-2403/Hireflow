import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as companyService from "./company.service.js";

const createCompany = asyncHandler(async (req, res) => {
  const result = await companyService.createCompany(req.user.id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, result.message, result.company));
});

const updateCompany = asyncHandler(async (req, res) => {
  const result = await companyService.updateCompany(req.user.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.company));
});

const getPublicCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getPublicCompany();

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Company profile fetched successfully", company),
    );
});

const createRecruiter = asyncHandler(async (req, res) => {
  const result = await companyService.createRecruiter(req.user.id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, result.message, result.recruiter));
});

const listRecruiters = asyncHandler(async (req, res) => {
  const recruiters = await companyService.listRecruiters(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Recruiters fetched successfully", recruiters));
});

const updateRecruiterStatus = asyncHandler(async (req, res) => {
  const result = await companyService.updateRecruiterStatus(
    req.user.id,
    req.params.recruiterId,
    req.body.isActive,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.recruiter));
});

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  const result = await companyService.uploadCompanyLogo(req.user.id, req.file);

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.company));
});

export {
  createCompany,
  updateCompany,
  getPublicCompany,
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
  uploadCompanyLogo,
};
