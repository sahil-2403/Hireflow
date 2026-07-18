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

const RECOMMENDATION_POOL_SIZE = 200;

const STAGE_ONE_WEIGHTS = Object.freeze({
  skillOverlap: 50,
  title: 20,
  experience: 10,
  workplaceType: 8,
  employmentType: 6,
  location: 6,
  textSearch: 10,
});

const EXPERIENCE_RANK = Object.freeze({
  entry: 0,
  mid: 1,
  senior: 2,
  lead: 3,
});

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

const compareStableJobOrder = (firstJob, secondJob) => {
  const firstCreatedAt = new Date(firstJob.createdAt || 0).getTime();

  const secondCreatedAt = new Date(secondJob.createdAt || 0).getTime();

  if (firstCreatedAt !== secondCreatedAt) {
    return secondCreatedAt - firstCreatedAt;
  }

  return String(firstJob._id).localeCompare(String(secondJob._id));
};

const sortRecommendedJobs = (jobs, sortBy, order) => {
  const direction = order === "asc" ? 1 : -1;

  return [...jobs].sort((firstJob, secondJob) => {
    const firstValue = getComparableValue(firstJob, sortBy);

    const secondValue = getComparableValue(secondJob, sortBy);

    let comparison = 0;

    if (typeof firstValue === "string" || typeof secondValue === "string") {
      comparison = String(firstValue).localeCompare(String(secondValue));
    } else if (firstValue !== secondValue) {
      comparison = firstValue > secondValue ? 1 : -1;
    }

    if (comparison !== 0) {
      return comparison * direction;
    }

    return compareStableJobOrder(firstJob, secondJob);
  });
};

const buildDatabaseSort = ({ sortBy, order }) => {
  const direction = order === "asc" ? 1 : -1;

  if (sortBy === "createdAt") {
    return {
      createdAt: direction,
      _id: 1,
    };
  }

  return {
    [sortBy]: direction,
    createdAt: -1,
    _id: 1,
  };
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

const normalizeRetrievalValue = (value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
};

const toNormalizedStringArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.map(normalizeRetrievalValue).filter(Boolean))];
};

const getResumeRetrievalSignals = (resumeAnalysis) => {
  const extracted = resumeAnalysis?.extracted || {};

  const projects = Array.isArray(extracted.projects) ? extracted.projects : [];

  const projectTechnologies = projects.flatMap((project) =>
    Array.isArray(project?.technologies) ? project.technologies : [],
  );

  return {
    skills: toNormalizedStringArray([
      ...(extracted.skills || []),
      ...(extracted.programmingLanguages || []),
      ...(extracted.frameworks || []),
      ...(extracted.databases || []),
      ...(extracted.tools || []),
      ...projectTechnologies,
    ]),

    targetRoles: toNormalizedStringArray(extracted.targetRoles || []),
  };
};

const buildLocationRetrievalTerms = (locations) => {
  const normalizedLocations = toNormalizedStringArray(locations);

  const cityTerms = normalizedLocations.flatMap((location) => {
    const primaryLocation = location.split(",")[0]?.trim();

    return primaryLocation ? [location, primaryLocation] : [location];
  });

  return [...new Set(cityTerms.filter(Boolean))];
};

const buildRecommendationRetrievalSignals = ({ candidate, resumeAnalysis }) => {
  const resumeSignals = getResumeRetrievalSignals(resumeAnalysis);

  const candidateLocations =
    Array.isArray(candidate.preferredLocations) &&
    candidate.preferredLocations.length > 0
      ? candidate.preferredLocations
      : [candidate.location];

  const normalizedExperienceLevel = normalizeRetrievalValue(
    candidate.experienceLevel,
  );

  const experienceRank = EXPERIENCE_RANK[normalizedExperienceLevel];

  return {
    skills: toNormalizedStringArray([
      ...(candidate.skills || []),
      ...resumeSignals.skills,
    ]),

    targetTitles: toNormalizedStringArray([
      ...(candidate.targetJobTitles || []),
      ...resumeSignals.targetRoles,
      candidate.headline,
    ]),

    workplaceTypes: toNormalizedStringArray(
      candidate.preferredWorkplaceTypes || [],
    ),

    employmentTypes: toNormalizedStringArray(
      candidate.preferredEmploymentTypes || [],
    ),

    locations: buildLocationRetrievalTerms(candidateLocations),

    experienceRank: Number.isInteger(experienceRank) ? experienceRank : null,
  };
};

const buildJobExperienceRankExpression = () => {
  return {
    $switch: {
      branches: [
        {
          case: {
            $eq: ["$experienceLevel", "entry"],
          },
          then: 0,
        },
        {
          case: {
            $eq: ["$experienceLevel", "mid"],
          },
          then: 1,
        },
        {
          case: {
            $eq: ["$experienceLevel", "senior"],
          },
          then: 2,
        },
        {
          case: {
            $eq: ["$experienceLevel", "lead"],
          },
          then: 3,
        },
      ],
      default: -1,
    },
  };
};

const buildStageOneExperienceScore = (experienceRank) => {
  if (!Number.isInteger(experienceRank)) {
    return 0;
  }

  return {
    $switch: {
      branches: [
        {
          case: {
            $eq: ["$stageOneExperienceRank", -1],
          },
          then: 0,
        },
        {
          case: {
            $gte: [experienceRank, "$stageOneExperienceRank"],
          },
          then: STAGE_ONE_WEIGHTS.experience,
        },
        {
          case: {
            $eq: [
              {
                $subtract: ["$stageOneExperienceRank", experienceRank],
              },
              1,
            ],
          },
          then: STAGE_ONE_WEIGHTS.experience * 0.6,
        },
      ],
      default: 0,
    },
  };
};

const buildStageOneCandidatePoolPipeline = ({
  filters,
  signals,
  hasTextSearch,
}) => {
  const titleRegex =
    signals.targetTitles.length > 0
      ? signals.targetTitles.map(escapeRegex).join("|")
      : null;

  const locationRegex =
    signals.locations.length > 0
      ? signals.locations.map(escapeRegex).join("|")
      : null;

  const normalizedJobSkillsExpression = {
    $map: {
      input: {
        $ifNull: ["$skills", []],
      },
      as: "skill",
      in: {
        $toLower: {
          $trim: {
            input: "$$skill",
          },
        },
      },
    },
  };

  const titleScore = titleRegex
    ? {
        $cond: [
          {
            $regexMatch: {
              input: {
                $ifNull: ["$title", ""],
              },
              regex: titleRegex,
              options: "i",
            },
          },
          STAGE_ONE_WEIGHTS.title,
          0,
        ],
      }
    : 0;

  const workplaceScore =
    signals.workplaceTypes.length > 0
      ? {
          $cond: [
            {
              $in: [
                {
                  $toLower: {
                    $ifNull: ["$workplaceType", ""],
                  },
                },
                signals.workplaceTypes,
              ],
            },
            STAGE_ONE_WEIGHTS.workplaceType,
            0,
          ],
        }
      : 0;

  const employmentScore =
    signals.employmentTypes.length > 0
      ? {
          $cond: [
            {
              $in: [
                {
                  $toLower: {
                    $ifNull: ["$employmentType", ""],
                  },
                },
                signals.employmentTypes,
              ],
            },
            STAGE_ONE_WEIGHTS.employmentType,
            0,
          ],
        }
      : 0;

  const locationMatches = locationRegex
    ? {
        $regexMatch: {
          input: {
            $ifNull: ["$location", ""],
          },
          regex: locationRegex,
          options: "i",
        },
      }
    : false;

  const locationScore = {
    $cond: [
      {
        $or: [
          {
            $eq: ["$workplaceType", "remote"],
          },
          locationMatches,
        ],
      },
      STAGE_ONE_WEIGHTS.location,
      0,
    ],
  };

  const textSearchScore = hasTextSearch
    ? {
        $multiply: ["$stageOneTextSearchScore", STAGE_ONE_WEIGHTS.textSearch],
      }
    : 0;

  return [
    {
      $match: filters,
    },

    {
      $set: {
        stageOneNormalizedSkills: normalizedJobSkillsExpression,

        stageOneJobSkillCount: {
          $size: {
            $ifNull: ["$skills", []],
          },
        },

        stageOneExperienceRank: buildJobExperienceRankExpression(),

        ...(hasTextSearch
          ? {
              stageOneTextSearchScore: {
                $meta: "textScore",
              },
            }
          : {}),
      },
    },

    {
      $set: {
        stageOneSkillOverlapCount: {
          $size: {
            $setIntersection: ["$stageOneNormalizedSkills", signals.skills],
          },
        },
      },
    },

    {
      $set: {
        stageOneRetrievalScore: {
          $add: [
            {
              $multiply: [
                STAGE_ONE_WEIGHTS.skillOverlap,

                {
                  $divide: [
                    "$stageOneSkillOverlapCount",

                    {
                      $cond: [
                        {
                          $gt: ["$stageOneJobSkillCount", 0],
                        },

                        "$stageOneJobSkillCount",
                        1,
                      ],
                    },
                  ],
                },
              ],
            },

            titleScore,

            buildStageOneExperienceScore(signals.experienceRank),

            workplaceScore,
            employmentScore,
            locationScore,
            textSearchScore,
          ],
        },
      },
    },

    {
      $sort: {
        stageOneRetrievalScore: -1,
        createdAt: -1,
        _id: 1,
      },
    },

    {
      $limit: RECOMMENDATION_POOL_SIZE,
    },

    {
      $project: {
        _id: 1,
      },
    },
  ];
};

const loadJobCardsByIds = async (jobIds) => {
  if (jobIds.length === 0) {
    return [];
  }

  return Job.find({
    _id: {
      $in: jobIds,
    },
  })
    .populate({
      path: "companyId",
      select: "name logoUrl industry headquarters",
    })
    .select("-createdBy")
    .lean();
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

  const jobSignature = buildJobMatchSignature(job);

  const cachedFit = await JobResumeFit.findOne({
    candidateUserId: userId,
    jobId: job._id,
    resumeAnalysisId: resumeAnalysis._id,
    jobSignature,
    resumeSignature: resumeSource.resumeSignature,
  })
    .sort({
      generatedAt: -1,
    })
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
  const candidate = await Candidate.findOne({
    userId,
  }).lean();

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

  const aiEnhancement = buildAiSuggestedJobsEnhancement(resumeAnalysis);

  /*
   * Match-score sorting needs two-stage
   * recommendation ranking.
   */
  if (sortBy === "matchScore") {
    const signals = buildRecommendationRetrievalSignals({
      candidate,
      resumeAnalysis,
    });

    const pipeline = buildStageOneCandidatePoolPipeline({
      filters,
      signals,
      hasTextSearch: Boolean(query.search?.trim()),
    });

    const candidatePoolRows = await Job.aggregate(pipeline);

    const candidatePoolIds = candidatePoolRows.map((item) => item._id);

    const candidatePool = await loadJobCardsByIds(candidatePoolIds);

    /*
     * This expensive exact calculation
     * is now bounded to at most 200 jobs.
     */
    const exactlyScoredJobs = candidatePool.map((job) =>
      buildRecommendedJobResponse(job, candidate, resumeAnalysis),
    );

    const rankedJobs = sortRecommendedJobs(exactlyScoredJobs, sortBy, order);

    const paginatedJobs = rankedJobs.slice(skip, skip + limit);

    const total = rankedJobs.length;

    return {
      jobs: paginatedJobs,

      pagination: buildPaginationResponse({
        page,
        limit,
        total,
      }),

      ranking: {
        strategy: "two_stage_exact_rerank",

        candidatePoolSize: candidatePool.length,

        candidatePoolLimit: RECOMMENDATION_POOL_SIZE,

        exactScoredJobs: exactlyScoredJobs.length,
      },

      aiEnhancement,
    };
  }

  /*
   * Newest, title, and salary sorts can
   * use database pagination first.
   */
  const databaseSort = buildDatabaseSort({
    sortBy,
    order,
  });

  const [jobs, total] = await Promise.all([
    Job.find(filters)
      .sort(databaseSort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "companyId",
        select: "name logoUrl industry headquarters",
      })
      .select("-createdBy")
      .lean(),

    Job.countDocuments(filters),
  ]);

  /*
   * Match scores are calculated only for
   * jobs displayed on this page.
   */
  const jobsWithMatches = jobs.map((job) =>
    buildRecommendedJobResponse(job, candidate, resumeAnalysis),
  );

  return {
    jobs: jobsWithMatches,

    pagination: buildPaginationResponse({
      page,
      limit,
      total,
    }),

    ranking: {
      strategy: "database_paginated",

      candidatePoolSize: jobs.length,

      candidatePoolLimit: limit,

      exactScoredJobs: jobsWithMatches.length,
    },

    aiEnhancement,
  };
};

const getRecommendedJobMatch = async (userId, jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const [candidate, job] = await Promise.all([
    Candidate.findOne({
      userId,
    }).lean(),

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
