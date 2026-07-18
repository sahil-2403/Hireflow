import crypto from "crypto";
import mongoose from "mongoose";

import { getAiConfig } from "../../config/ai.js";

import { AI_FEATURE_KEYS, APPLICATION_STATUS } from "../../config/constants.js";

import ApiError from "../../shared/errors/ApiError.js";

import { getStaffCompany } from "../../shared/utils/companyAccess.js";

import { buildJobMatchSignature } from "../../shared/services/matchScore.service.js";

import Application from "../application/application.model.js";
import Job from "../job/job.model.js";
import JobShortlist from "../jobShortlist/jobShortlist.model.js";

import {
  createApplicationMatchSnapshot,
  shouldRefreshApplicationMatchSnapshot,
} from "../application/applicationMatch.service.js";

import { createResumeSignature } from "../resumeAnalysis/resumeAnalysis.service.js";

import { consumeAiUsage, getAiUsageState } from "../aiUsage/aiUsage.service.js";

import {
  buildAiSystemInstruction,
  buildSuggestedShortlistPrompt,
} from "./aiPrompt.service.js";

import { ensureAiProviderReady, generateAiJson } from "./aiProvider.service.js";

const ELIGIBLE_SHORTLIST_STATUSES = [
  APPLICATION_STATUS.APPLIED,
  APPLICATION_STATUS.SCREENING,
  APPLICATION_STATUS.INTERVIEW,
];

const DEFAULT_SUGGESTED_SHORTLIST_LIMIT = 5;

const toStringOrNull = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Candidate";
};

const getApplicationResumeSignature = (application) => {
  return createResumeSignature({
    resumeUrl: application.resumeUrl,
    resumePublicId: null,
  });
};

const getCurrentResumeReview = ({
  application,
  jobSignature,
  resumeSignature,
}) => {
  const review = application.resumeReviewSnapshot;

  if (!review) {
    return null;
  }

  if (review.jobSignature !== jobSignature) {
    return null;
  }

  if (review.resumeSignature !== resumeSignature) {
    return null;
  }

  return review;
};

const getCompleteEligibleApplications = (applications) => {
  if (!Array.isArray(applications)) {
    return [];
  }

  return applications.filter((application) => {
    return (
      ELIGIBLE_SHORTLIST_STATUSES.includes(application.status) &&
      application.candidateId &&
      application.candidateUserId &&
      application.resumeUrl
    );
  });
};

const refreshApplicationMatchSnapshots = async ({ applications, job }) => {
  const updates = [];

  for (const application of applications) {
    const candidate = application.candidateId;

    if (!candidate) {
      continue;
    }

    if (
      shouldRefreshApplicationMatchSnapshot(
        application.matchSnapshot,
        job,
        candidate,
      )
    ) {
      application.matchSnapshot = createApplicationMatchSnapshot(
        job,
        candidate,
      );

      updates.push({
        updateOne: {
          filter: {
            _id: application._id,
          },
          update: {
            $set: {
              matchSnapshot: application.matchSnapshot,
            },
          },
        },
      });
    }
  }

  if (updates.length > 0) {
    await Application.bulkWrite(updates, {
      ordered: false,
    });
  }

  return applications;
};

const buildRankedCandidate = ({ application, jobSignature }) => {
  const candidate = application.candidateId;

  const resumeSignature = getApplicationResumeSignature(application);

  const resumeReview = getCurrentResumeReview({
    application,
    jobSignature,
    resumeSignature,
  });

  const matchSnapshot = application.matchSnapshot;

  const matchScore =
    resumeReview?.enhancedMatchScore ?? matchSnapshot?.matchScore ?? 0;

  const matchLabel =
    resumeReview?.alignmentLevel ||
    matchSnapshot?.matchLabel ||
    "Match unavailable";

  const confidenceScore =
    resumeReview?.confidenceScore ?? matchSnapshot?.confidenceScore ?? 0;

  const confidenceLevel =
    resumeReview?.confidenceLevel || matchSnapshot?.confidenceLevel || null;

  const matchedSkills =
    resumeReview?.matchedSkills?.length > 0
      ? resumeReview.matchedSkills
      : matchSnapshot?.matchedSkills || [];

  const missingSkills =
    resumeReview?.missingSkills?.length > 0
      ? resumeReview.missingSkills
      : matchSnapshot?.missingSkills || [];

  return {
    applicationId: application._id.toString(),
    candidateId: candidate._id.toString(),
    candidateUserId:
      application.candidateUserId?._id?.toString?.() ||
      application.candidateUserId.toString(),

    candidateName: getCandidateName(candidate),
    headline: candidate.headline || null,
    experienceLevel: candidate.experienceLevel || null,
    profileSkills: candidate.skills || [],
    applicationStatus: application.status,
    appliedAt: application.appliedAt,

    matchScore,
    matchLabel,
    confidenceScore,
    confidenceLevel,
    matchedSkills,
    missingSkills,

    matchEngineVersion: matchSnapshot?.engineVersion || null,

    matchJobSignature: matchSnapshot?.jobSignature || null,

    matchCandidateSignature: matchSnapshot?.candidateSignature || null,

    resumeReview: resumeReview
      ? {
          summary: resumeReview.summary,
          resumeStrengths: resumeReview.resumeStrengths || [],
          missingOrWeakAreas: resumeReview.missingOrWeakAreas || [],
          interviewFocus: resumeReview.interviewFocus || [],
        }
      : null,

    resumeReviewJobSignature: resumeReview?.jobSignature || null,

    resumeReviewResumeSignature: resumeReview?.resumeSignature || null,

    resumeReviewGeneratedAt: resumeReview?.generatedAt || null,
  };
};

const sortRankedCandidates = (candidates) => {
  return [...candidates].sort((firstCandidate, secondCandidate) => {
    if (firstCandidate.matchScore !== secondCandidate.matchScore) {
      return secondCandidate.matchScore - firstCandidate.matchScore;
    }

    if (firstCandidate.confidenceScore !== secondCandidate.confidenceScore) {
      return secondCandidate.confidenceScore - firstCandidate.confidenceScore;
    }

    return firstCandidate.applicationId.localeCompare(
      secondCandidate.applicationId,
    );
  });
};

const buildCandidateSetSignature = ({ jobSignature, candidates }) => {
  const signaturePayload = {
    jobSignature,

    candidates: candidates.map((candidate) => ({
      applicationId: candidate.applicationId,

      candidateId: candidate.candidateId,

      applicationStatus: candidate.applicationStatus,

      matchScore: candidate.matchScore,

      confidenceScore: candidate.confidenceScore,

      matchEngineVersion: candidate.matchEngineVersion,

      matchJobSignature: candidate.matchJobSignature,

      matchCandidateSignature: candidate.matchCandidateSignature,

      resumeReviewJobSignature: candidate.resumeReviewJobSignature,

      resumeReviewResumeSignature: candidate.resumeReviewResumeSignature,

      resumeReviewGeneratedAt: candidate.resumeReviewGeneratedAt,
    })),
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(signaturePayload))
    .digest("hex");
};

const buildShortlistCandidateContext = ({
  job,
  applications,
  requestedLimit,
}) => {
  const normalizedRequestedLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : DEFAULT_SUGGESTED_SHORTLIST_LIMIT;

  const completeApplications = getCompleteEligibleApplications(applications);

  const jobSignature = buildJobMatchSignature(job);

  const rankedCandidates = sortRankedCandidates(
    completeApplications.map((application) =>
      buildRankedCandidate({
        application,
        jobSignature,
      }),
    ),
  );

  const aiConfig = getAiConfig();

  const maxShortlistCandidates = aiConfig.maxShortlistCandidates;

  const effectiveLimit =
    maxShortlistCandidates > 0
      ? Math.min(
          normalizedRequestedLimit,
          maxShortlistCandidates,
          rankedCandidates.length,
        )
      : 0;

  const candidateSetSignature = buildCandidateSetSignature({
    jobSignature,
    candidates: rankedCandidates,
  });

  return {
    completeApplications,
    rankedCandidates,

    jobSignature,
    candidateSetSignature,

    requestedLimit: normalizedRequestedLimit,

    effectiveLimit,
    maxShortlistCandidates,
  };
};

const normalizeSuggestedShortlistOutput = ({ output, selectedCandidates }) => {
  const providerCandidates = Array.isArray(output?.candidates)
    ? output.candidates
    : [];

  const providerCandidateMap = new Map(
    providerCandidates
      .map((candidate) => [toStringOrNull(candidate?.applicationId), candidate])
      .filter(([applicationId]) => applicationId),
  );

  return selectedCandidates.map((candidate) => {
    const providerCandidate = providerCandidateMap.get(candidate.applicationId);

    const fallbackStrengths =
      candidate.matchedSkills.length > 0
        ? candidate.matchedSkills.map(
            (skill) => `Profile or resume evidence supports ${skill}.`,
          )
        : [];

    const fallbackVerificationPoints =
      candidate.missingSkills.length > 0
        ? candidate.missingSkills.map(
            (skill) => `Verify practical experience with ${skill}.`,
          )
        : [];

    return {
      applicationId: candidate.applicationId,
      candidateId: candidate.candidateId,
      candidateUserId: candidate.candidateUserId,
      candidateName: candidate.candidateName,
      headline: candidate.headline,
      applicationStatus: candidate.applicationStatus,
      matchScore: candidate.matchScore,
      matchLabel: candidate.matchLabel,
      confidenceLevel: candidate.confidenceLevel,
      matchedSkills: candidate.matchedSkills,
      missingSkills: candidate.missingSkills,

      summary:
        toStringOrNull(providerCandidate?.summary) ||
        `${candidate.candidateName} has a ${candidate.matchLabel.toLowerCase()} based on the available job-related profile and resume evidence.`,

      strengths:
        toStringArray(providerCandidate?.strengths).length > 0
          ? toStringArray(providerCandidate?.strengths)
          : fallbackStrengths,

      verificationPoints:
        toStringArray(providerCandidate?.verificationPoints).length > 0
          ? toStringArray(providerCandidate?.verificationPoints)
          : fallbackVerificationPoints,
    };
  });
};

const formatSuggestedShortlist = (shortlist) => {
  return {
    id: shortlist._id.toString(),
    jobId: shortlist.jobId.toString(),
    requestedLimit: shortlist.requestedLimit,
    totalEligibleCandidates: shortlist.totalEligibleCandidates,
    candidates: shortlist.candidates,
    provider: shortlist.provider,
    model: shortlist.model,
    generatedAt: shortlist.generatedAt,
    createdAt: shortlist.createdAt,
    updatedAt: shortlist.updatedAt,
  };
};

const getSuggestedShortlistAvailability = async ({
  userId,
  job,
  applications,
  requestedLimit = DEFAULT_SUGGESTED_SHORTLIST_LIMIT,
}) => {
  const usage = await getAiUsageState({
    userId,
    featureKey: AI_FEATURE_KEYS.SHORTLIST,
  });

  const {
    rankedCandidates,
    jobSignature,
    candidateSetSignature,
    effectiveLimit,
    maxShortlistCandidates,
  } = buildShortlistCandidateContext({
    job,
    applications,
    requestedLimit,
  });

  const baseAvailability = {
    eligibleApplicationCount: rankedCandidates.length,

    requestedLimit: effectiveLimit,

    canGenerate: false,
    blockReason: null,

    shortlist: null,
    usage,
  };

  if (rankedCandidates.length === 0) {
    return {
      ...baseAvailability,

      blockReason: "no_eligible_applications",
    };
  }

  if (maxShortlistCandidates <= 0) {
    return {
      ...baseAvailability,

      blockReason: "feature_unavailable",
    };
  }

  const cachedShortlist = await JobShortlist.findOne({
    jobId: job._id,
    jobSignature,
    candidateSetSignature,
    requestedLimit: effectiveLimit,
  }).sort({
    generatedAt: -1,
  });

  /*
   * A valid cached shortlist remains
   * available even after today's usage
   * limit has been exhausted.
   */
  if (cachedShortlist) {
    return {
      ...baseAvailability,

      shortlist: formatSuggestedShortlist(cachedShortlist),
    };
  }

  if (usage.remaining <= 0) {
    return {
      ...baseAvailability,

      blockReason: "daily_limit",
    };
  }

  return {
    ...baseAvailability,

    canGenerate: true,
  };
};

const generateSuggestedShortlist = async ({
  userId,
  role,
  jobId,
  requestedLimit,
}) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to generate suggested shortlists",
  );

  const job = await Job.findOne({
    _id: jobId,
    companyId: company._id,
  }).lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const applications = await Application.find({
    companyId: company._id,
    jobId: job._id,
    status: {
      $in: ELIGIBLE_SHORTLIST_STATUSES,
    },
  })
    .select("+matchSnapshot +resumeReviewSnapshot")
    .populate({
      path: "candidateId",
      select:
        "firstName lastName headline summary skills experienceLevel location resumeUrl linkedinUrl githubUrl portfolioUrl targetJobTitles preferredLocations preferredWorkplaceTypes preferredEmploymentTypes",
    })
    .populate({
      path: "candidateUserId",
      select: "username email profilePhotoUrl",
    })
    .lean();

  const completeApplications = getCompleteEligibleApplications(applications);

  if (completeApplications.length === 0) {
    throw new ApiError(400, "No eligible applications found for this job");
  }

  await refreshApplicationMatchSnapshots({
    applications: completeApplications,
    job,
  });

  const {
    jobSignature,
    rankedCandidates,
    candidateSetSignature,
    effectiveLimit,
    maxShortlistCandidates,
  } = buildShortlistCandidateContext({
    job,

    applications: completeApplications,

    requestedLimit,
  });

  if (maxShortlistCandidates <= 0) {
    throw new ApiError(503, "AI shortlist candidate limit is not configured");
  }

  const selectedCandidates = rankedCandidates.slice(0, effectiveLimit);

  const cachedShortlist = await JobShortlist.findOne({
    jobId: job._id,
    jobSignature,
    candidateSetSignature,
    requestedLimit: effectiveLimit,
  }).sort({
    generatedAt: -1,
  });

  if (cachedShortlist) {
    return {
      reused: true,

      job: {
        _id: job._id,
        title: job.title,
      },

      shortlist: formatSuggestedShortlist(cachedShortlist),

      usage: await getAiUsageState({
        userId,
        featureKey: AI_FEATURE_KEYS.SHORTLIST,
      }),
    };
  }

  const readyAiConfig = ensureAiProviderReady();

  const usage = await consumeAiUsage({
    userId,
    companyId: company._id,
    featureKey: AI_FEATURE_KEYS.SHORTLIST,
  });

  const rawOutput = await generateAiJson({
    prompt: buildSuggestedShortlistPrompt({
      job,
      candidates: selectedCandidates,
    }),

    systemInstruction: buildAiSystemInstruction("AI Suggested Shortlist"),

    temperature: 0.2,
    maxOutputTokens: 3072,
  });

  const normalizedCandidates = normalizeSuggestedShortlistOutput({
    output: rawOutput,
    selectedCandidates,
  });

  const shortlist = await JobShortlist.create({
    companyId: company._id,
    jobId: job._id,
    generatedBy: userId,
    jobSignature,
    candidateSetSignature,
    requestedLimit: effectiveLimit,
    totalEligibleCandidates: rankedCandidates.length,
    candidates: normalizedCandidates,
    provider: readyAiConfig.provider,
    model: readyAiConfig.model,
    rawOutput,
    generatedAt: new Date(),
  });

  return {
    reused: false,

    job: {
      _id: job._id,
      title: job.title,
    },

    shortlist: formatSuggestedShortlist(shortlist),

    usage,
  };
};

export {
  generateSuggestedShortlist,
  getSuggestedShortlistAvailability,
  normalizeSuggestedShortlistOutput,
  formatSuggestedShortlist,
};
