import mongoose from "mongoose";

import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  WORKPLACE_TYPE,
} from "../../config/constants.js";

import { calculateJobCandidateMatch } from "../../shared/services/matchScore.service.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

const buildJobFilters = (query) => {
  const filters = {
    status: JOB_STATUS.OPEN,
  };

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

const getSortConfig = (query) => {
  const allowedSortFields = [
    "matchScore",
    "createdAt",
    "title",
    "salaryMin",
    "salaryMax",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "matchScore";

  const order = query.order === "asc" ? "asc" : "desc";

  return {
    sortBy,
    order,
  };
};

const getComparableValue = (item, sortBy) => {
  if (sortBy === "matchScore") {
    return item.match?.matchScore ?? -1;
  }

  if (sortBy === "title") {
    return item.title || "";
  }

  if (sortBy === "createdAt") {
    return new Date(item.createdAt || 0).getTime();
  }

  if (sortBy === "salaryMin" || sortBy === "salaryMax") {
    return item[sortBy] ?? -1;
  }

  return 0;
};

const sortRecommendedJobs = (jobs, sortBy, order) => {
  const direction = order === "asc" ? 1 : -1;

  return [...jobs].sort((firstJob, secondJob) => {
    const firstValue = getComparableValue(firstJob, sortBy);
    const secondValue = getComparableValue(secondJob, sortBy);

    if (typeof firstValue === "string" || typeof secondValue === "string") {
      return String(firstValue).localeCompare(String(secondValue)) * direction;
    }

    if (firstValue === secondValue) {
      return (
        new Date(secondJob.createdAt || 0).getTime() -
        new Date(firstJob.createdAt || 0).getTime()
      );
    }

    return (firstValue > secondValue ? 1 : -1) * direction;
  });
};

const buildRecommendedJobResponse = (job, candidate) => {
  const match = calculateJobCandidateMatch(job, candidate);

  return {
    _id: job._id,
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    workplaceType: job.workplaceType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    isSalaryVisible: job.isSalaryVisible,
    skills: job.skills,
    createdAt: job.createdAt,
    companyId: job.companyId,

    match: {
      matchScore: match.matchScore,
      matchLabel: match.matchLabel,
      confidenceScore: match.confidenceScore,
      confidenceLevel: match.confidenceLevel,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      warnings: match.warnings,
      calculatedAt: match.calculatedAt,
    },
  };
};

const listRecommendedJobs = async (userId, query) => {
  const candidate = await Candidate.findOne({
    userId,
  }).lean();

  if (!candidate) {
    throw new ApiError(404, "Candidate profile not found");
  }

  const { page, limit, skip } = normalizePagination(query);

  const { sortBy, order } = getSortConfig(query);

  const filters = buildJobFilters(query);

  const jobs = await Job.find(filters)
    .populate({
      path: "companyId",
      select: "name logoUrl industry headquarters",
    })
    .select("-createdBy")
    .lean();

  const recommendedJobs = jobs.map((job) =>
    buildRecommendedJobResponse(job, candidate),
  );

  const sortedJobs = sortRecommendedJobs(recommendedJobs, sortBy, order);

  const paginatedJobs = sortedJobs.slice(skip, skip + limit);

  const total = sortedJobs.length;

  return {
    jobs: paginatedJobs,
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

const getRecommendedJobMatch = async (userId, jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const candidate = await Candidate.findOne({
    userId,
  }).lean();

  if (!candidate) {
    throw new ApiError(404, "Candidate profile not found");
  }

  const job = await Job.findOne({
    _id: jobId,
    status: JOB_STATUS.OPEN,
  }).lean();

  if (!job) {
    throw new ApiError(404, "Open job not found");
  }

  const match = calculateJobCandidateMatch(job, candidate);

  return {
    job: {
      _id: job._id,
      title: job.title,
    },

    match,
  };
};

export { listRecommendedJobs, getRecommendedJobMatch };
