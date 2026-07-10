import mongoose from "mongoose";

import Application from "./application.model.js";
import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import { JOB_STATUS, APPLICATION_STATUS } from "../../config/constants.js";

import { getStaffCompany } from "../../shared/utils/companyAccess.js";

import {
  buildApplicationMatchResponse,
  createApplicationMatchSnapshot,
  shouldRefreshApplicationMatchSnapshot,
} from "./applicationMatch.service.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const JOB_MATCH_DEPENDENCY_FIELDS = [
  "title",
  "description",
  "requirements",
  "skills",
  "location",
  "employmentType",
  "workplaceType",
  "experienceLevel",
  "status",
].join(" ");

const CANDIDATE_MATCH_DEPENDENCY_FIELDS = [
  "headline",
  "summary",
  "skills",
  "experienceLevel",
  "location",
  "resumeUrl",
  "linkedinUrl",
  "githubUrl",
  "portfolioUrl",
  "targetJobTitles",
  "preferredLocations",
  "preferredWorkplaceTypes",
  "preferredEmploymentTypes",
].join(" ");

const MANAGED_APPLICATION_POPULATE_OPTIONS = [
  {
    path: "jobId",
    select: "title status",
  },
  {
    path: "candidateId",
    select:
      "firstName lastName headline skills experienceLevel location resumeUrl",
  },
  {
    path: "candidateUserId",
    select: "username email profilePhotoUrl",
  },
  {
    path: "reviewedBy",
    select: "username email role",
  },
  {
    path: "statusHistory.changedBy",
    select: "username email role",
  },
];

const JOB_APPLICATION_LIST_POPULATE_OPTIONS = [
  {
    path: "candidateId",
    select:
      "firstName lastName headline skills experienceLevel location resumeUrl",
  },
  {
    path: "candidateUserId",
    select: "username email profilePhotoUrl",
  },
  {
    path: "reviewedBy",
    select: "username email role",
  },
];

const JOB_APPLICATION_DETAIL_POPULATE_OPTIONS = [
  {
    path: "jobId",
    select:
      "title description requirements skills location employmentType workplaceType experienceLevel status createdAt",
  },
  {
    path: "candidateId",
    select:
      "firstName lastName headline summary skills experienceLevel location resumeUrl linkedinUrl githubUrl portfolioUrl targetJobTitles preferredLocations preferredWorkplaceTypes preferredEmploymentTypes",
  },
  {
    path: "candidateUserId",
    select: "username email profilePhotoUrl",
  },
  {
    path: "reviewedBy",
    select: "username email role",
  },
  {
    path: "statusHistory.changedBy",
    select: "username email role",
  },
];

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

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createSearchRegex = (value) => {
  return new RegExp(escapeRegex(value.trim()), "i");
};

const getIdKey = (value) => {
  const id = value?._id ?? value;

  return id ? String(id) : null;
};

const getUniqueReferenceIds = (applications, fieldName) => {
  return [
    ...new Set(
      applications
        .map((application) => getIdKey(application[fieldName]))
        .filter(Boolean),
    ),
  ];
};

const buildDocumentMap = (documents) => {
  return new Map(documents.map((document) => [String(document._id), document]));
};

const createEmptyStatusCounts = () => {
  return Object.values(APPLICATION_STATUS).reduce((counts, status) => {
    counts[status] = 0;

    return counts;
  }, {});
};

const createEmptyMatchCounts = () => {
  return {
    excellent: 0,
    strong: 0,
    good: 0,
    partial: 0,
    low: 0,
  };
};

const getMatchBucket = (matchScore) => {
  if (matchScore >= 85) {
    return "excellent";
  }

  if (matchScore >= 70) {
    return "strong";
  }

  if (matchScore >= 55) {
    return "good";
  }

  if (matchScore >= 40) {
    return "partial";
  }

  return "low";
};

const getAllowedNextStatuses = (status) => {
  return STATUS_TRANSITIONS[status] || [];
};

const getSortDirection = (order) => {
  return order === "asc" ? 1 : -1;
};

const normalizeManagedApplicationJobsQuery = (query) => {
  const allowedSortFields = [
    "createdAt",
    "applicationCount",
    "lastApplicationAt",
    "title",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "lastApplicationAt";

  const order = query.order === "asc" ? "asc" : "desc";

  const includeEmpty = query.includeEmpty === "true";

  return {
    ...normalizePagination(query),
    search: query.search?.trim() || "",
    status: query.status || "",
    sortBy,
    order,
    includeEmpty,
  };
};

const normalizeManagedJobApplicationsQuery = (query) => {
  const allowedSortFields = ["matchScore", "appliedAt", "candidateName"];

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "matchScore";

  const order = query.order === "asc" ? "asc" : "desc";

  return {
    ...normalizePagination(query),
    search: query.search?.trim() || "",
    status: query.status || "",
    sortBy,
    order,
  };
};

const buildApplicationListMatchResponse = (snapshot) => {
  const match = buildApplicationMatchResponse(snapshot);

  if (!match) {
    return null;
  }

  return {
    matchScore: match.matchScore,
    matchLabel: match.matchLabel,
    confidenceScore: match.confidenceScore,
    confidenceLevel: match.confidenceLevel,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    extraCandidateSkills: match.extraCandidateSkills,
    warnings: match.warnings,
    calculatedAt: match.calculatedAt,
  };
};

const refreshApplicationMatches = async (applications) => {
  if (applications.length === 0) {
    return applications;
  }

  const jobIds = getUniqueReferenceIds(applications, "jobId");
  const candidateIds = getUniqueReferenceIds(applications, "candidateId");

  const [jobs, candidates] = await Promise.all([
    jobIds.length > 0
      ? Job.find({
          _id: {
            $in: jobIds,
          },
        })
          .select(JOB_MATCH_DEPENDENCY_FIELDS)
          .lean()
      : [],

    candidateIds.length > 0
      ? Candidate.find({
          _id: {
            $in: candidateIds,
          },
        })
          .select(CANDIDATE_MATCH_DEPENDENCY_FIELDS)
          .lean()
      : [],
  ]);

  const jobsById = buildDocumentMap(jobs);

  const candidatesById = buildDocumentMap(candidates);

  const snapshotUpdates = [];

  const refreshedApplications = applications.map((application) => {
    const job = jobsById.get(getIdKey(application.jobId));

    const candidate = candidatesById.get(getIdKey(application.candidateId));

    let snapshot = application.matchSnapshot ?? null;

    if (
      job &&
      candidate &&
      shouldRefreshApplicationMatchSnapshot(snapshot, job, candidate)
    ) {
      snapshot = createApplicationMatchSnapshot(job, candidate);

      snapshotUpdates.push({
        updateOne: {
          filter: {
            _id: application._id,
          },
          update: {
            $set: {
              matchSnapshot: snapshot,
            },
          },
        },
      });
    }

    return {
      ...application,
      matchSnapshot: snapshot,
    };
  });

  if (snapshotUpdates.length > 0) {
    await Application.bulkWrite(snapshotUpdates, {
      ordered: false,
    });
  }

  return refreshedApplications;
};

const buildApplicationStatusSummary = (applications) => {
  const statusCounts = createEmptyStatusCounts();

  const matchCounts = createEmptyMatchCounts();

  applications.forEach((application) => {
    if (statusCounts[application.status] !== undefined) {
      statusCounts[application.status] += 1;
    }

    const matchScore = application.matchSnapshot?.matchScore;

    if (typeof matchScore === "number") {
      matchCounts[getMatchBucket(matchScore)] += 1;
    }
  });

  return {
    totalApplications: applications.length,
    statusCounts,
    matchCounts,
  };
};

const buildJobApplicationSummaryMap = (applications) => {
  const summaryByJobId = new Map();

  applications.forEach((application) => {
    const jobId = getIdKey(application.jobId);

    if (!jobId) {
      return;
    }

    if (!summaryByJobId.has(jobId)) {
      summaryByJobId.set(jobId, {
        applicationCount: 0,
        lastApplicationAt: null,
        bestMatch: null,
        statusCounts: createEmptyStatusCounts(),
      });
    }

    const summary = summaryByJobId.get(jobId);

    summary.applicationCount += 1;

    if (summary.statusCounts[application.status] !== undefined) {
      summary.statusCounts[application.status] += 1;
    }

    if (
      application.appliedAt &&
      (!summary.lastApplicationAt ||
        new Date(application.appliedAt) > new Date(summary.lastApplicationAt))
    ) {
      summary.lastApplicationAt = application.appliedAt;
    }

    const match = buildApplicationListMatchResponse(application.matchSnapshot);

    if (
      match &&
      (summary.bestMatch === null ||
        match.matchScore > summary.bestMatch.matchScore)
    ) {
      summary.bestMatch = {
        matchScore: match.matchScore,
        matchLabel: match.matchLabel,
        confidenceLevel: match.confidenceLevel,
      };
    }
  });

  return summaryByJobId;
};

const getCandidateDisplayName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "";
};

const matchesApplicationSearch = (application, search) => {
  if (!search) {
    return true;
  }

  const candidate = application.candidateId;

  const candidateUser = application.candidateUserId;

  const searchableText = [
    candidate?.firstName,
    candidate?.lastName,
    candidate?.headline,
    candidate?.location,
    candidateUser?.username,
    candidateUser?.email,
    ...(candidate?.skills || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(search.toLowerCase());
};

const sortJobApplications = (applications, sortBy, order) => {
  const sortDirection = getSortDirection(order);

  return [...applications].sort((firstApplication, secondApplication) => {
    if (sortBy === "appliedAt") {
      const firstDate = new Date(firstApplication.appliedAt || 0).getTime();

      const secondDate = new Date(secondApplication.appliedAt || 0).getTime();

      return (firstDate - secondDate) * sortDirection;
    }

    if (sortBy === "candidateName") {
      const firstName = getCandidateDisplayName(firstApplication.candidateId);

      const secondName = getCandidateDisplayName(secondApplication.candidateId);

      return firstName.localeCompare(secondName) * sortDirection;
    }

    const firstScore = firstApplication.matchSnapshot?.matchScore ?? -1;

    const secondScore = secondApplication.matchSnapshot?.matchScore ?? -1;

    return (firstScore - secondScore) * sortDirection;
  });
};

const paginateItems = (items, page, limit, skip) => {
  return items.slice(skip, skip + limit);
};

const buildManagedApplicationListItem = (application) => {
  return {
    _id: application._id,
    status: application.status,
    appliedAt: application.appliedAt,
    reviewedBy: application.reviewedBy || null,

    candidate: application.candidateId
      ? {
          _id: application.candidateId._id,
          firstName: application.candidateId.firstName,
          lastName: application.candidateId.lastName,
          headline: application.candidateId.headline,
          location: application.candidateId.location,
          experienceLevel: application.candidateId.experienceLevel,
          skills: application.candidateId.skills || [],
          resumeUrl: application.candidateId.resumeUrl,
        }
      : null,

    candidateUser: application.candidateUserId
      ? {
          _id: application.candidateUserId._id,
          username: application.candidateUserId.username,
          email: application.candidateUserId.email,
          profilePhotoUrl: application.candidateUserId.profilePhotoUrl,
        }
      : null,

    match: buildApplicationListMatchResponse(application.matchSnapshot),
  };
};

const buildManagedApplicationDetailResponse = (application) => {
  return {
    application: {
      _id: application._id,
      status: application.status,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      appliedAt: application.appliedAt,
      reviewedBy: application.reviewedBy || null,
      statusHistory: application.statusHistory || [],
    },

    candidate: application.candidateId
      ? {
          _id: application.candidateId._id,
          firstName: application.candidateId.firstName,
          lastName: application.candidateId.lastName,
          headline: application.candidateId.headline,
          summary: application.candidateId.summary,
          location: application.candidateId.location,
          experienceLevel: application.candidateId.experienceLevel,
          skills: application.candidateId.skills || [],
          resumeUrl: application.candidateId.resumeUrl,
          linkedinUrl: application.candidateId.linkedinUrl,
          githubUrl: application.candidateId.githubUrl,
          portfolioUrl: application.candidateId.portfolioUrl,
          targetJobTitles: application.candidateId.targetJobTitles || [],
          preferredLocations: application.candidateId.preferredLocations || [],
          preferredWorkplaceTypes:
            application.candidateId.preferredWorkplaceTypes || [],
          preferredEmploymentTypes:
            application.candidateId.preferredEmploymentTypes || [],
        }
      : null,

    candidateUser: application.candidateUserId
      ? {
          _id: application.candidateUserId._id,
          username: application.candidateUserId.username,
          email: application.candidateUserId.email,
          profilePhotoUrl: application.candidateUserId.profilePhotoUrl,
        }
      : null,

    job: application.jobId
      ? {
          _id: application.jobId._id,
          title: application.jobId.title,
          description: application.jobId.description,
          requirements: application.jobId.requirements,
          skills: application.jobId.skills || [],
          location: application.jobId.location,
          employmentType: application.jobId.employmentType,
          workplaceType: application.jobId.workplaceType,
          experienceLevel: application.jobId.experienceLevel,
          status: application.jobId.status,
          createdAt: application.jobId.createdAt,
        }
      : null,

    match: buildApplicationMatchResponse(application.matchSnapshot),

    allowedNextStatuses: getAllowedNextStatuses(application.status),
  };
};

const buildLegacyManagedApplicationResponse = (application) => {
  const applicationResponse = {
    ...application,
    match: buildApplicationListMatchResponse(application.matchSnapshot),
  };

  delete applicationResponse.matchSnapshot;

  return applicationResponse;
};

const getOwnedJobOrThrow = async (companyId, jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: jobId,
    companyId,
  }).lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return job;
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

  const matchSnapshot = createApplicationMatchSnapshot(job, candidate);

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
      matchSnapshot,
    });

    const applicationResponse = application.toObject();

    delete applicationResponse.matchSnapshot;

    return {
      application: applicationResponse,
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
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

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
      .select("+matchSnapshot")
      .sort({
        appliedAt: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filters),
  ]);

  const refreshedApplications = await refreshApplicationMatches(applications);

  const applicationsWithMatches = refreshedApplications.map(
    buildLegacyManagedApplicationResponse,
  );

  const populatedApplications = await Application.populate(
    applicationsWithMatches,
    MANAGED_APPLICATION_POPULATE_OPTIONS,
  );

  return {
    applications: populatedApplications,
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

const listManagedApplicationJobs = async (userId, role, query) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

  const { page, limit, skip, search, status, sortBy, order, includeEmpty } =
    normalizeManagedApplicationJobsQuery(query);

  const jobFilters = {
    companyId: company._id,
  };

  if (status) {
    if (!Object.values(JOB_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid job status");
    }

    jobFilters.status = status;
  }

  if (search) {
    const searchRegex = createSearchRegex(search);

    jobFilters.$or = [
      {
        title: searchRegex,
      },
      {
        location: searchRegex,
      },
      {
        skills: searchRegex,
      },
    ];
  }

  const basePipeline = [
    {
      $match: jobFilters,
    },
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "jobId",
        as: "applications",
      },
    },
    {
      $addFields: {
        applicationCount: {
          $size: "$applications",
        },
        lastApplicationAt: {
          $max: "$applications.appliedAt",
        },
      },
    },
  ];

  if (!includeEmpty) {
    basePipeline.push({
      $match: {
        applicationCount: {
          $gt: 0,
        },
      },
    });
  }

  const sortDirection = getSortDirection(order);

  const sortOptions = {
    [sortBy]: sortDirection,
    _id: 1,
  };

  const [result] = await Job.aggregate([
    ...basePipeline,
    {
      $facet: {
        jobs: [
          {
            $sort: sortOptions,
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              applications: 0,
              description: 0,
              requirements: 0,
              createdBy: 0,
            },
          },
        ],
        total: [
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  const jobs = result?.jobs || [];

  const total = result?.total?.[0]?.count || 0;

  const jobIds = jobs.map((job) => job._id);

  const pageApplications =
    jobIds.length > 0
      ? await Application.find({
          companyId: company._id,
          jobId: {
            $in: jobIds,
          },
        })
          .select("+matchSnapshot jobId candidateId status appliedAt")
          .lean()
      : [];

  const refreshedApplications =
    await refreshApplicationMatches(pageApplications);

  const summaryByJobId = buildJobApplicationSummaryMap(refreshedApplications);

  const jobsWithApplicationSummary = jobs.map((job) => {
    const summary = summaryByJobId.get(String(job._id)) || {
      applicationCount: 0,
      lastApplicationAt: null,
      bestMatch: null,
      statusCounts: createEmptyStatusCounts(),
    };

    return {
      _id: job._id,
      title: job.title,
      status: job.status,
      location: job.location,
      employmentType: job.employmentType,
      workplaceType: job.workplaceType,
      experienceLevel: job.experienceLevel,
      createdAt: job.createdAt,
      applicationCount: summary.applicationCount,
      lastApplicationAt: summary.lastApplicationAt,
      bestMatch: summary.bestMatch,
      statusCounts: summary.statusCounts,
    };
  });

  return {
    jobs: jobsWithApplicationSummary,
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

const listManagedJobApplications = async (userId, role, jobId, query) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

  const job = await getOwnedJobOrThrow(company._id, jobId);

  const { page, limit, skip, search, status, sortBy, order } =
    normalizeManagedJobApplicationsQuery(query);

  if (status && !Object.values(APPLICATION_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid application status");
  }

  const applications = await Application.find({
    companyId: company._id,
    jobId: job._id,
  })
    .select("+matchSnapshot")
    .lean();

  const refreshedApplications = await refreshApplicationMatches(applications);

  const populatedApplications = await Application.populate(
    refreshedApplications,
    JOB_APPLICATION_LIST_POPULATE_OPTIONS,
  );

  const summary = buildApplicationStatusSummary(populatedApplications);

  const filteredApplications = populatedApplications.filter((application) => {
    if (status && application.status !== status) {
      return false;
    }

    return matchesApplicationSearch(application, search);
  });

  const sortedApplications = sortJobApplications(
    filteredApplications,
    sortBy,
    order,
  );

  const paginatedApplications = paginateItems(
    sortedApplications,
    page,
    limit,
    skip,
  );

  return {
    job: {
      _id: job._id,
      title: job.title,
      status: job.status,
      location: job.location,
      employmentType: job.employmentType,
      workplaceType: job.workplaceType,
      experienceLevel: job.experienceLevel,
      createdAt: job.createdAt,
    },
    summary,
    applications: paginatedApplications.map(buildManagedApplicationListItem),
    pagination: {
      page,
      limit,
      total: filteredApplications.length,
      totalPages: Math.ceil(filteredApplications.length / limit),
      hasNextPage: page * limit < filteredApplications.length,
      hasPreviousPage: page > 1,
    },
  };
};

const getManagedJobApplicationDetails = async (
  userId,
  role,
  jobId,
  applicationId,
) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

  const job = await getOwnedJobOrThrow(company._id, jobId);

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
    jobId: job._id,
  })
    .select("+matchSnapshot")
    .lean();

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const [refreshedApplication] = await refreshApplicationMatches([application]);

  const populatedApplication = await Application.populate(
    refreshedApplication,
    JOB_APPLICATION_DETAIL_POPULATE_OPTIONS,
  );

  return buildManagedApplicationDetailResponse(populatedApplication);
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

  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

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

  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to manage applications",
  );

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
  listManagedApplicationJobs,
  listManagedJobApplications,
  getManagedJobApplicationDetails,
  updateApplicationStatus,
  getManagedApplicationResume,
};
