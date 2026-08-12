import mongoose from "mongoose";

import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";
import JobResumeFit from "../jobResumeFit/jobResumeFit.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  buildCandidateProfileResumeSource,
  findLatestCompletedResumeAnalysis,
} from "../resumeAnalysis/resumeAnalysis.service.js";

import {
  AI_FEATURE_KEYS,
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  RESUME_ANALYSIS_SOURCE_TYPES,
  WORKPLACE_TYPE,
} from "../../config/constants.js";

import { getAiUsageState } from "../aiUsage/aiUsage.service.js";

import {
  buildJobMatchSignature,
  calculateJobCandidateMatch,
} from "../../shared/services/matchScore.service.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

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

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
      $regex: escapeRegex(query.location.trim()),
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

  return {
    sortBy: allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : "matchScore",
    order: query.order === "asc" ? "asc" : "desc",
  };
};

const getComparableValue = (job, sortBy) => {
  if (sortBy === "matchScore") {
    return job.match?.matchScore ?? -1;
  }

  if (sortBy === "title") {
    return job.title || "";
  }

  if (sortBy === "createdAt") {
    return new Date(job.createdAt || 0).getTime();
  }

  if (sortBy === "salaryMin" || sortBy === "salaryMax") {
    return job[sortBy] ?? -1;
  }

  return 0;
};

const sortRecommendedJobs = (jobs, sortBy, order) => {
  const direction = order === "asc" ? 1 : -1;

  return [...jobs].sort((firstJob, secondJob) => {
    const firstValue = getComparableValue(firstJob, sortBy);
    const secondValue = getComparableValue(secondJob, sortBy);

    if (typeof firstValue === "string" || typeof secondValue === "string") {
      const comparison = String(firstValue).localeCompare(String(secondValue));

      if (comparison !== 0) {
        return comparison * direction;
      }
    } else if (firstValue !== secondValue) {
      return (firstValue > secondValue ? 1 : -1) * direction;
    }

    return new Date(secondJob.createdAt || 0) - new Date(firstJob.createdAt || 0);
  });
};

const buildAiSuggestedJobsEnhancement = (resumeAnalysis) => {
  const isEnabled = Boolean(resumeAnalysis);

  return {
    enabled: isEnabled,
    source: isEnabled ? "stored_resume_insights" : "candidate_profile",
    matchBasis: isEnabled ? "profile_and_resume" : "profile",
    resumeAnalysisId: resumeAnalysis?._id?.toString?.() || null,
  };
};

const buildPaginationResponse = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
};

const buildRecommendedJobResponse = (job, candidate, resumeAnalysis = null) => {
  const match = calculateJobCandidateMatch(job, candidate, {
    resumeAnalysis,
  });

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
      matchBasis: match.matchBasis,
      profileScore: match.profileScore,
      resumeBoost: match.resumeBoost,
      confidenceScore: match.confidenceScore,
      confidenceLevel: match.confidenceLevel,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      resumeEvidence: match.resumeEvidence,
      warnings: match.warnings,
      calculatedAt: match.calculatedAt,
    },
  };
};

const formatJobResumeFit = (fit) => {
  if (!fit) {
    return null;
  }

  return {
    id: fit._id.toString(),
    jobId: fit.jobId.toString(),
    resumeAnalysisId: fit.resumeAnalysisId?.toString?.() || null,
    enhancedMatchScore: fit.enhancedMatchScore,
    matchLabel: fit.matchLabel,
    matchBasis: fit.matchBasis,
    profileScore: fit.profileScore,
    resumeBoost: fit.resumeBoost,
    confidenceScore: fit.confidenceScore,
    confidenceLevel: fit.confidenceLevel,
    matchedSkills: fit.matchedSkills || [],
    missingSkills: fit.missingSkills || [],
    resumeEvidence: fit.resumeEvidence || [],
    summary: fit.summary,
    matchedRequirements: fit.matchedRequirements || [],
    missingRequirements: fit.missingRequirements || [],
    resumeImprovements: fit.resumeImprovements || [],
    profileImprovements: fit.profileImprovements || [],
    beforeApplyingChecklist: fit.beforeApplyingChecklist || [],
    provider: fit.provider,
    model: fit.model,
    generatedAt: fit.generatedAt,
    createdAt: fit.createdAt,
    updatedAt: fit.updatedAt,
  };
};

const getCurrentCandidateResumeContext = async ({
  candidateUserId,
  candidate,
}) => {
  if (!candidate?.resumeUrl) {
    return {
      resumeSource: null,
      resumeAnalysis: null,
    };
  }

  const resumeSource = buildCandidateProfileResumeSource(candidate);

  const resumeAnalysis = await findLatestCompletedResumeAnalysis({
    candidateUserId,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
    resumeSignature: resumeSource.resumeSignature,
  });

  return {
    resumeSource,
    resumeAnalysis,
  };
};

const buildAiResumeFitEligibility = async ({
  userId,
  candidate,
  job,
  resumeSource,
  resumeAnalysis,
}) => {
  const usage = await getAiUsageState({
    userId,
    featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
  });

  const baseEligibility = {
    hasCandidateProfile: true,
    hasResume: Boolean(candidate.resumeUrl),
    hasResumeInsights: Boolean(resumeAnalysis),
    canGenerate: false,
    blockReason: null,
    fit: null,
    usage,
  };

  if (!candidate.resumeUrl) {
    return {
      ...baseEligibility,
      blockReason: "missing_resume",
    };
  }

  if (!resumeAnalysis || !resumeSource) {
    return {
      ...baseEligibility,
      blockReason: "missing_resume_insights",
    };
  }

  const cachedFit = await JobResumeFit.findOne({
    candidateUserId: userId,
    jobId: job._id,
    resumeAnalysisId: resumeAnalysis._id,
    jobSignature: buildJobMatchSignature(job),
    resumeSignature: resumeSource.resumeSignature,
  })
    .sort({ generatedAt: -1 })
    .lean();

  if (cachedFit) {
    return {
      ...baseEligibility,
      fit: formatJobResumeFit(cachedFit),
    };
  }

  if (usage.remaining <= 0) {
    return {
      ...baseEligibility,
      blockReason: "daily_limit",
    };
  }

  return {
    ...baseEligibility,
    canGenerate: true,
  };
};

const listRecommendedJobs = async (userId, query) => {
  const candidate = await Candidate.findOne({ userId }).lean();

  if (!candidate) {
    throw new ApiError(404, "Candidate profile not found");
  }

  const { page, limit, skip } = normalizePagination(query);
  const { sortBy, order } = getSortConfig(query);
  const filters = buildJobFilters(query);

  const { resumeAnalysis } = await getCurrentCandidateResumeContext({
    candidateUserId: userId,
    candidate,
  });

  const jobs = await Job.find(filters)
    .populate({
      path: "companyId",
      select: "name logoUrl industry headquarters",
    })
    .select("-createdBy")
    .lean();

  const scoredJobs = jobs.map((job) =>
    buildRecommendedJobResponse(job, candidate, resumeAnalysis),
  );

  const rankedJobs = sortRecommendedJobs(scoredJobs, sortBy, order);
  const paginatedJobs = rankedJobs.slice(skip, skip + limit);

  return {
    jobs: paginatedJobs,
    pagination: buildPaginationResponse({
      page,
      limit,
      total: rankedJobs.length,
    }),
    ranking: {
      strategy: "direct_match_scoring",
      exactScoredJobs: scoredJobs.length,
    },
    aiEnhancement: buildAiSuggestedJobsEnhancement(resumeAnalysis),
  };
};

const getRecommendedJobMatch = async (userId, jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const [candidate, job] = await Promise.all([
    Candidate.findOne({ userId }).lean(),
    Job.findOne({
      _id: jobId,
      status: JOB_STATUS.OPEN,
    }).lean(),
  ]);

  if (!candidate) {
    throw new ApiError(404, "Candidate profile not found");
  }

  if (!job) {
    throw new ApiError(404, "Open job not found");
  }

  const { resumeSource, resumeAnalysis } =
    await getCurrentCandidateResumeContext({
      candidateUserId: userId,
      candidate,
    });

  const match = calculateJobCandidateMatch(job, candidate, {
    resumeAnalysis,
  });

  const aiResumeFit = await buildAiResumeFitEligibility({
    userId,
    candidate,
    job,
    resumeSource,
    resumeAnalysis,
  });

  return {
    job: {
      _id: job._id,
      title: job.title,
    },
    match,
    aiResumeFit,
  };
};

export { listRecommendedJobs, getRecommendedJobMatch };
