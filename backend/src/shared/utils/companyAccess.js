import Company from "../../modules/company/company.model.js";
import Recruiter from "../../modules/recruiter/recruiter.model.js";

import ApiError from "../errors/ApiError.js";

import { ROLES } from "../../config/constants.js";

const getOwnerCompany = async (ownerId) => {
  const company = await Company.findOne({
    ownerId,
  });

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  return company;
};

const getRecruiterCompany = async (userId) => {
  const recruiter = await Recruiter.findOne({
    userId,
    isActive: true,
  });

  if (!recruiter) {
    throw new ApiError(403, "Active recruiter profile not found");
  }

  const company = await Company.findById(recruiter.companyId);

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  return company;
};

const getStaffCompany = async (userId, role) => {
  if (role === ROLES.OWNER) {
    return getOwnerCompany(userId);
  }

  if (role === ROLES.RECRUITER) {
    return getRecruiterCompany(userId);
  }

  throw new ApiError(403, "You are not allowed to access company resources");
};

export { getOwnerCompany, getRecruiterCompany, getStaffCompany };