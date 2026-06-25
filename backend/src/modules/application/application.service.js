import mongoose from "mongoose";

import Application from "./application.model.js";
import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";
import Company from "../company/company.model.js";
import Recruiter from "../recruiter/recruiter.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  ROLES,
  JOB_STATUS,
  APPLICATION_STATUS,
} from "../../config/constants.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const STATUS_TRANSITIONS = {
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.REJECTED,
  ],

  [APPLICATION_STATUS.SCREENING]: [
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.REJECTED,
  ],

  [APPLICATION_STATUS.INTERVIEW]: [
    APPLICATION_STATUS.OFFER,
    APPLICATION_STATUS.REJECTED,
  ],

  [APPLICATION_STATUS.OFFER]: [
    APPLICATION_STATUS.HIRED,
    APPLICATION_STATUS.REJECTED,
  ],

  [APPLICATION_STATUS.HIRED]: [],
  [APPLICATION_STATUS.REJECTED]: [],
};

const normalizePagination = (query) => {
  const requestedPage = Number(query.page);
  const requestedLimit = Number(query.limit);

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : DEFAULT_PAGE;

  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getStaffCompany = async (userId, role) => {
  if (role === ROLES.OWNER) {
    const company = await Company.findOne({
      ownerId: userId,
    });

    if (!company) {
      throw new ApiError(404, "Company profile not found");
    }

    return company;
  }

  if (role === ROLES.RECRUITER) {
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
  }

  throw new ApiError(403, "You are not allowed to manage applications");
};

const applyToJob = async (candidateUserId, jobId, applicationData) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const candidate = await Candidate.findOne({
    userId: candidateUserId,
  });

  if (!candidate) {
    throw new ApiError(400, "Complete your candidate profile before applying");
  }

  if (!candidate.resumeUrl) {
    throw new ApiError(400, "Upload or add a resume before applying");
  }

  const job = await Job.findOne({
    _id: jobId,
    status: JOB_STATUS.OPEN,
  });

  if (!job) {
    throw new ApiError(404, "Open job not found");
  }

  const existingApplication = await Application.findOne({
    jobId: job._id,
    candidateUserId,
  });

  if (existingApplication) {
    throw new ApiError(409, "You have already applied to this job");
  }

  try {
    const application = await Application.create({
      jobId: job._id,
      candidateId: candidate._id,
      candidateUserId,
      companyId: job.companyId,
      coverLetter: applicationData.coverLetter,
      resumeUrl: candidate.resumeUrl,
      status: APPLICATION_STATUS.APPLIED,
      statusHistory: [
        {
          status: APPLICATION_STATUS.APPLIED,
          changedBy: candidateUserId,
        },
      ],
    });

    return {
      application,
      message: "Application submitted successfully",
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You have already applied to this job");
    }

    throw error;
  }
};

const listMyApplications = async (candidateUserId, query) => {
  const { page, limit, skip } = normalizePagination(query);

  const filters = {
    candidateUserId,
  };

  if (query.status) {
    if (!Object.values(APPLICATION_STATUS).includes(query.status)) {
      throw new ApiError(400, "Invalid application status");
    }

    filters.status = query.status;
  }

  const [applications, total] = await Promise.all([
    Application.find(filters)
      .populate({
        path: "jobId",
        select:
          "title location employmentType workplaceType experienceLevel status",
      })
      .populate({
        path: "companyId",
        select: "name logoUrl industry headquarters",
      })
      .sort({
        appliedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filters),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

const listManagedApplications = async (userId, role, query) => {
  const company = await getStaffCompany(userId, role);

  const { page, limit, skip } = normalizePagination(query);

  const filters = {
    companyId: company._id,
  };

  if (query.jobId) {
    if (!mongoose.isValidObjectId(query.jobId)) {
      throw new ApiError(400, "Invalid job ID");
    }

    filters.jobId = query.jobId;
  }

  if (query.status) {
    if (!Object.values(APPLICATION_STATUS).includes(query.status)) {
      throw new ApiError(400, "Invalid application status");
    }

    filters.status = query.status;
  }

  const sortOrder = query.order === "asc" ? 1 : -1;

  const [applications, total] = await Promise.all([
    Application.find(filters)
      .populate({
        path: "jobId",
        select: "title status",
      })
      .populate({
        path: "candidateId",
        select:
          "firstName lastName headline skills experienceLevel location resumeUrl",
      })
      .populate({
        path: "candidateUserId",
        select: "username email",
      })
      .populate({
        path: "reviewedBy",
        select: "username email role",
      })
      .populate({
        path: "statusHistory.changedBy",
        select: "username email role",
      })
      .sort({
        appliedAt: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filters),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

const updateApplicationStatus = async (
  userId,
  role,
  applicationId,
  nextStatus,
) => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const company = await getStaffCompany(userId, role);

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
  });

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.status === nextStatus) {
    throw new ApiError(400, "Application already has this status");
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[application.status] || [];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Cannot move application from ${application.status} to ${nextStatus}`,
    );
  }

  application.status = nextStatus;
  application.reviewedBy = userId;

  application.statusHistory.push({
    status: nextStatus,
    changedBy: userId,
  });

  await application.save();

  return {
    application,
    message: "Application status updated successfully",
  };
};

const getManagedApplicationResume = async (userId, role, applicationId) => {
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const company = await getStaffCompany(userId, role);

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
  })
    .populate({
      path: "candidateId",
      select: "firstName lastName resumeUrl",
    })
    .lean();

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (!application.candidateId?.resumeUrl) {
    throw new ApiError(404, "Resume not found");
  }

  const firstName = application.candidateId.firstName || "candidate";

  const lastName = application.candidateId.lastName || "resume";

  return {
    resumeUrl: application.candidateId.resumeUrl,
    fileName: `${firstName}-${lastName}-resume.pdf`,
  };
};

export {
  applyToJob,
  listMyApplications,
  listManagedApplications,
  updateApplicationStatus,
  getManagedApplicationResume,
};
