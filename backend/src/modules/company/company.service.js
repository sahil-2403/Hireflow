import Company from "./company.model.js";
import Recruiter from "../recruiter/recruiter.model.js";
import User from "../auth/auth.model.js";

import ApiError from "../../shared/errors/ApiError.js";
import { ROLES } from "../../config/constants.js";

import {
  uploadLogoFile,
  deleteAsset,
} from "../../shared/services/media.service.js";

import {
  getOwnerCompany,
  getStaffCompany,
} from "../../shared/utils/companyAccess.js";

const getMyCompany = async (userId, role) => {
  const company = await getStaffCompany(userId, role);

  return company;
};

const createCompany = async (ownerId, companyData) => {
  const existingCompany = await Company.findOne({
    ownerId,
  });

  if (existingCompany) {
    throw new ApiError(
      409,
      "A company profile already exists for this account",
    );
  }

  const company = await Company.create({
    ...companyData,
    ownerId,
  });

  return {
    company,
    message: "Company profile created successfully",
  };
};

const updateCompany = async (ownerId, companyData) => {
  const company = await Company.findOneAndUpdate(
    {
      ownerId,
    },
    {
      $set: companyData,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!company) {
    throw new ApiError(404, "Company profile not found");
  }

  return {
    company,
    message: "Company profile updated successfully",
  };
};

const createRecruiter = async (ownerId, recruiterData) => {
  const company = await getOwnerCompany(ownerId);

  const existingUser = await User.findOne({
    $or: [{ email: recruiterData.email }, { username: recruiterData.username }],
  });

  if (existingUser) {
    if (existingUser.email === recruiterData.email) {
      throw new ApiError(409, "Email already exists");
    }

    throw new ApiError(409, "Username already exists");
  }

  let user;

  try {
    user = await User.create({
      username: recruiterData.username,
      email: recruiterData.email,
      password: recruiterData.password,
      role: ROLES.RECRUITER,
      isEmailVerified: true,
    });

    const recruiter = await Recruiter.create({
      userId: user._id,
      companyId: company._id,
      firstName: recruiterData.firstName,
      lastName: recruiterData.lastName,
      jobTitle: recruiterData.jobTitle,
      createdBy: ownerId,
    });

    return {
      recruiter: {
        id: recruiter._id,
        userId: user._id,
        username: user.username,
        email: user.email,
        firstName: recruiter.firstName,
        lastName: recruiter.lastName,
        jobTitle: recruiter.jobTitle,
        isActive: recruiter.isActive,
      },
      message: "Recruiter created successfully",
    };
  } catch (error) {
    if (user?._id) {
      await User.findByIdAndDelete(user._id);
    }

    throw error;
  }
};

const listRecruiters = async (ownerId) => {
  const company = await getOwnerCompany(ownerId);

  const recruiters = await Recruiter.find({
    companyId: company._id,
  })
    .populate({
      path: "userId",
      select: "username email role",
    })
    .sort({
      createdAt: -1,
    })
    .lean();

  return recruiters;
};

const updateRecruiterStatus = async (ownerId, recruiterId, isActive) => {
  const company = await getOwnerCompany(ownerId);

  const recruiter = await Recruiter.findOneAndUpdate(
    {
      _id: recruiterId,
      companyId: company._id,
    },
    {
      $set: {
        isActive,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!recruiter) {
    throw new ApiError(404, "Recruiter not found");
  }

  const updatedUser = await User.findByIdAndUpdate(
    recruiter.userId,
    {
      $set: {
        isActive,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    throw new ApiError(404, "Recruiter user account not found");
  }

  await recruiter.populate({
    path: "userId",
    select: "username email role isActive",
  });

  return {
    recruiter,
    message: isActive
      ? "Recruiter activated successfully"
      : "Recruiter deactivated successfully",
  };
};

const uploadCompanyLogo = async (ownerId, file) => {
  if (!file) {
    throw new ApiError(400, "Company logo file is required");
  }

  const company = await getOwnerCompany(ownerId);

  const oldPublicId = company.logoPublicId;

  const uploadedAsset = await uploadLogoFile(file.buffer);

  try {
    company.logoUrl = uploadedAsset.url;
    company.logoPublicId = uploadedAsset.publicId;

    await company.save();
  } catch (error) {
    await deleteAsset(uploadedAsset.publicId, "image");

    throw error;
  }

  await deleteAsset(oldPublicId, "image");

  return {
    company,
    message: "Company logo uploaded successfully",
  };
};

export {
  getMyCompany,
  createCompany,
  updateCompany,
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
  uploadCompanyLogo,
};
