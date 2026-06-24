import mongoose from "mongoose";

import Job from "./job.model.js";
import Company from "../company/company.model.js";
import Recruiter from "../recruiter/recruiter.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  ROLES,
  JOB_STATUS,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
} from "../../config/constants.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

  throw new ApiError(403, "You are not allowed to manage jobs");
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

const createJob = async (userId, role, jobData) => {
  const company = await getStaffCompany(userId, role);

  const job = await Job.create({
    ...jobData,
    companyId: company._id,
    createdBy: userId,
  });

  return {
    job,
    message: "Job created successfully",
  };
};

const updateJob = async (userId, role, jobId, jobData) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const company = await getStaffCompany(userId, role);

  const existingJob = await Job.findOne({
    _id: jobId,
    companyId: company._id,
  });

  if (!existingJob) {
    throw new ApiError(404, "Job not found");
  }

  const salaryMin =
    jobData.salaryMin !== undefined ? jobData.salaryMin : existingJob.salaryMin;

  const salaryMax =
    jobData.salaryMax !== undefined ? jobData.salaryMax : existingJob.salaryMax;

  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    throw new ApiError(
      400,
      "Maximum salary must be greater than or equal to minimum salary",
    );
  }

  Object.assign(existingJob, jobData);

  await existingJob.save();

  return {
    job: existingJob,
    message: "Job updated successfully",
  };
};

const updateJobStatus = async (userId, role, jobId, status) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const company = await getStaffCompany(userId, role);

  const job = await Job.findOneAndUpdate(
    {
      _id: jobId,
      companyId: company._id,
    },
    {
      $set: {
        status,
        closedAt: status === JOB_STATUS.CLOSED ? new Date() : null,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return {
    job,
    message:
      status === JOB_STATUS.OPEN
        ? "Job opened successfully"
        : "Job closed successfully",
  };
};

const buildJobFilters = (query, includeStatus = false) => {
  const filters = {};

  if (includeStatus && query.status) {
    if (!Object.values(JOB_STATUS).includes(query.status)) {
      throw new ApiError(400, "Invalid job status");
    }

    filters.status = query.status;
  }

  if (query.employmentType) {
    if (!Object.values(EMPLOYMENT_TYPE).includes(query.employmentType)) {
      throw new ApiError(400, "Invalid employment type");
    }

    filters.employmentType = query.employmentType;
  }

  if (query.workplaceType) {
    if (!Object.values(WORKPLACE_TYPE).includes(query.workplaceType)) {
      throw new ApiError(400, "Invalid workplace type");
    }

    filters.workplaceType = query.workplaceType;
  }

  if (query.experienceLevel) {
    if (!Object.values(EXPERIENCE_LEVEL).includes(query.experienceLevel)) {
      throw new ApiError(400, "Invalid experience level");
    }

    filters.experienceLevel = query.experienceLevel;
  }

  if (query.location?.trim()) {
    filters.location = {
      $regex: query.location.trim(),
      $options: "i",
    };
  }

  if (query.search?.trim()) {
    filters.$text = {
      $search: query.search.trim(),
    };
  }

  return filters;
};

const getSortOptions = (query, hasSearch) => {
  if (hasSearch) {
    return {
      score: {
        $meta: "textScore",
      },
    };
  }

  const allowedFields = ["createdAt", "title", "salaryMin", "salaryMax"];

  const sortBy = allowedFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const order = query.order === "asc" ? 1 : -1;

  return {
    [sortBy]: order,
  };
};

const listPublicJobs = async (query) => {
  const { page, limit, skip } = normalizePagination(query);

  const filters = {
    ...buildJobFilters(query),
    status: JOB_STATUS.OPEN,
  };

  const hasSearch = Boolean(query.search?.trim());

  const projection = hasSearch
    ? {
        score: {
          $meta: "textScore",
        },
      }
    : undefined;

  const [jobs, total] = await Promise.all([
    Job.find(filters, projection)
      .populate({
        path: "companyId",
        select: "name logoUrl industry headquarters",
      })
      .select("-createdBy")
      .sort(getSortOptions(query, hasSearch))
      .skip(skip)
      .limit(limit)
      .lean(),

    Job.countDocuments(filters),
  ]);

  return {
    jobs,
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

const getPublicJobById = async (jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: jobId,
    status: JOB_STATUS.OPEN,
  })
    .populate({
      path: "companyId",
      select: "name logoUrl industry websiteUrl description headquarters",
    })
    .select("-createdBy")
    .lean();

  if (!job) {
    throw new ApiError(404, "Open job not found");
  }

  return job;
};

const listManagedJobs = async (userId, role, query) => {
  const company = await getStaffCompany(userId, role);

  const { page, limit, skip } = normalizePagination(query);

  const filters = {
    ...buildJobFilters(query, true),
    companyId: company._id,
  };

  const hasSearch = Boolean(query.search?.trim());

  const projection = hasSearch
    ? {
        score: {
          $meta: "textScore",
        },
      }
    : undefined;

  const [jobs, total] = await Promise.all([
    Job.find(filters, projection)
      .populate({
        path: "createdBy",
        select: "username email role",
      })
      .sort(getSortOptions(query, hasSearch))
      .skip(skip)
      .limit(limit)
      .lean(),

    Job.countDocuments(filters),
  ]);

  return {
    jobs,
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

const getManagedJobById = async (userId, role, jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const company = await getStaffCompany(userId, role);

  const job = await Job.findOne({
    _id: jobId,
    companyId: company._id,
  })
    .populate({
      path: "createdBy",
      select: "username email role",
    })
    .lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return job;
};

export {
  createJob,
  updateJob,
  updateJobStatus,
  listPublicJobs,
  getPublicJobById,
  listManagedJobs,
  getManagedJobById,
};
