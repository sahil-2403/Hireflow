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

const attachManagedApplicationMatches = async (applications) => {
  if (applications.length === 0) {
    return applications;
  }

  const jobIds = getUniqueReferenceIds(applications, "jobId");
  const candidateIds = getUniqueReferenceIds(applications, "candidateId");

  const [jobs, candidates] = await Promise.all([
    jobIds.length > 0
      ? Job.find({
          _id: { $in: jobIds },
        })
          .select(JOB_MATCH_DEPENDENCY_FIELDS)
          .lean()
      : [],

    candidateIds.length > 0
      ? Candidate.find({
          _id: { $in: candidateIds },
        })
          .select(CANDIDATE_MATCH_DEPENDENCY_FIELDS)
          .lean()
      : [],
  ]);

  const jobsById = buildDocumentMap(jobs);
  const candidatesById = buildDocumentMap(candidates);
  const snapshotUpdates = [];

  const applicationsWithMatches = applications.map((application) => {
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

    const applicationResponse = {
      ...application,
      match: buildApplicationMatchResponse(snapshot),
    };

    delete applicationResponse.matchSnapshot;

    return applicationResponse;
  });

  if (snapshotUpdates.length > 0) {
    await Application.bulkWrite(snapshotUpdates, {
      ordered: false,
    });
  }

  return Application.populate(
    applicationsWithMatches,
    MANAGED_APPLICATION_POPULATE_OPTIONS,
  );
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

  const applicationsWithMatches =
    await attachManagedApplicationMatches(applications);

  return {
    applications: applicationsWithMatches,
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
  updateApplicationStatus,
  getManagedApplicationResume,
};
