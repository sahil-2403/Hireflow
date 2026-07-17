import crypto from "crypto";
import mongoose from "mongoose";

import { getAiConfig } from "../../config/ai.js";

import { AI_FEATURE_KEYS } from "../../config/constants.js";

import ApiError from "../../shared/errors/ApiError.js";

import { getStaffCompany } from "../../shared/utils/companyAccess.js";

import { buildJobMatchSignature } from "../../shared/services/matchScore.service.js";

import Application from "../application/application.model.js";
import CandidateComparison from "../candidateComparison/candidateComparison.model.js";
import Job from "../job/job.model.js";

import {
  createApplicationMatchSnapshot,
  shouldRefreshApplicationMatchSnapshot,
} from "../application/applicationMatch.service.js";

import { createResumeSignature } from "../resumeAnalysis/resumeAnalysis.service.js";

import { consumeAiUsage, getAiUsageState } from "../aiUsage/aiUsage.service.js";

import {
  buildAiSystemInstruction,
  buildCandidateComparisonPrompt,
} from "./aiPrompt.service.js";

import { ensureAiProviderReady, generateAiJson } from "./aiProvider.service.js";

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

const getReferenceId = (value) => {
  return value?._id ?? value;
};

const getReferenceIdString = (value) => {
  const id = getReferenceId(value);

  return id ? id.toString() : null;
};

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Candidate";
};

const getApplicationResumeSignature = (application) => {
  if (!application.resumeUrl) {
    return null;
  }

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

  if (!review || !resumeSignature) {
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

const buildComparisonCandidate = ({ application, jobSignature }) => {
  const candidate = application.candidateId;
  const matchSnapshot = application.matchSnapshot;

  const resumeSignature = getApplicationResumeSignature(application);

  const resumeReview = getCurrentResumeReview({
    application,
    jobSignature,
    resumeSignature,
  });

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
    candidateUserId: getReferenceIdString(application.candidateUserId),

    candidateName: getCandidateName(candidate),
    headline: candidate.headline || null,
    experienceLevel: candidate.experienceLevel || null,
    profileSkills: candidate.skills || [],
    applicationStatus: application.status,

    matchScore,
    matchLabel,
    confidenceScore,
    confidenceLevel,
    matchedSkills,
    missingSkills,

    candidateSignature: matchSnapshot?.candidateSignature || null,

    matchCalculatedAt: matchSnapshot?.calculatedAt || null,

    resumeReview: resumeReview
      ? {
          summary: resumeReview.summary,
          resumeStrengths: resumeReview.resumeStrengths || [],
          missingOrWeakAreas: resumeReview.missingOrWeakAreas || [],
          interviewFocus: resumeReview.interviewFocus || [],
          riskNotes: resumeReview.riskNotes || [],
        }
      : null,

    resumeReviewGeneratedAt: resumeReview?.generatedAt || null,
  };
};

const sortComparisonCandidates = (candidates) => {
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
  const payload = {
    jobSignature,

    candidates: candidates.map((candidate) => ({
      applicationId: candidate.applicationId,
      candidateId: candidate.candidateId,
      applicationStatus: candidate.applicationStatus,
      matchScore: candidate.matchScore,
      confidenceScore: candidate.confidenceScore,
      candidateSignature: candidate.candidateSignature,
      matchCalculatedAt: candidate.matchCalculatedAt,
      resumeReviewGeneratedAt: candidate.resumeReviewGeneratedAt,
    })),
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};

const getSharedMatchedSkills = (candidates) => {
  if (candidates.length === 0) {
    return [];
  }

  const firstCandidateSkills = toStringArray(candidates[0].matchedSkills);

  const remainingSkillSets = candidates
    .slice(1)
    .map(
      (candidate) =>
        new Set(
          toStringArray(candidate.matchedSkills).map((skill) =>
            skill.toLowerCase(),
          ),
        ),
    );

  return firstCandidateSkills.filter((skill) =>
    remainingSkillSets.every((skillSet) => skillSet.has(skill.toLowerCase())),
  );
};

const normalizeCandidateComparisonOutput = ({ output, selectedCandidates }) => {
  const providerCandidates = Array.isArray(output?.candidates)
    ? output.candidates
    : [];

  const providerCandidateMap = new Map(
    providerCandidates
      .map((candidate) => [toStringOrNull(candidate?.applicationId), candidate])
      .filter(([applicationId]) => applicationId),
  );

  const candidates = selectedCandidates.map((candidate) => {
    const providerCandidate = providerCandidateMap.get(candidate.applicationId);

    const providedEvidence = toStringArray(
      providerCandidate?.strongestEvidence,
    );

    const providedConcerns = toStringArray(providerCandidate?.concernsToVerify);

    const fallbackEvidence = candidate.matchedSkills.map(
      (skill) => `Available profile or resume evidence supports ${skill}.`,
    );

    const fallbackConcerns = candidate.missingSkills.map(
      (skill) => `Verify practical experience with ${skill}.`,
    );

    return {
      applicationId: candidate.applicationId,
      candidateId: candidate.candidateId,
      candidateUserId: candidate.candidateUserId,
      candidateName: candidate.candidateName,
      headline: candidate.headline,
      applicationStatus: candidate.applicationStatus,
      matchScore: candidate.matchScore,
      matchLabel: candidate.matchLabel,
      confidenceScore: candidate.confidenceScore,
      confidenceLevel: candidate.confidenceLevel,
      matchedSkills: candidate.matchedSkills,
      missingSkills: candidate.missingSkills,

      summary:
        toStringOrNull(providerCandidate?.summary) ||
        `${candidate.candidateName} has a ${candidate.matchLabel.toLowerCase()} based on the available job-related evidence.`,

      strongestEvidence:
        providedEvidence.length > 0 ? providedEvidence : fallbackEvidence,

      concernsToVerify:
        providedConcerns.length > 0 ? providedConcerns : fallbackConcerns,
    };
  });

  const fallbackDifferences = selectedCandidates.map(
    (candidate) =>
      `${candidate.candidateName}: ${candidate.matchScore}% deterministic match with ${candidate.matchedSkills.length} matched job skills.`,
  );

  const fallbackInterviewFocus = toStringArray(
    selectedCandidates.flatMap((candidate) =>
      candidate.missingSkills.map(
        (skill) => `Verify practical experience with ${skill}.`,
      ),
    ),
  );

  return {
    comparisonSummary:
      toStringOrNull(output?.comparisonSummary) ||
      `Comparison prepared using deterministic match information for ${selectedCandidates.length} candidates.`,

    sharedStrengths:
      toStringArray(output?.sharedStrengths).length > 0
        ? toStringArray(output?.sharedStrengths)
        : getSharedMatchedSkills(selectedCandidates),

    keyDifferences:
      toStringArray(output?.keyDifferences).length > 0
        ? toStringArray(output?.keyDifferences)
        : fallbackDifferences,

    interviewFocus:
      toStringArray(output?.interviewFocus).length > 0
        ? toStringArray(output?.interviewFocus)
        : fallbackInterviewFocus,

    candidates,
  };
};

const formatCandidateComparison = (comparison) => {
  return {
    id: comparison._id.toString(),
    jobId: comparison.jobId.toString(),
    selectedCandidateCount: comparison.selectedCandidateCount,
    comparisonSummary: comparison.comparisonSummary,
    sharedStrengths: comparison.sharedStrengths,
    keyDifferences: comparison.keyDifferences,
    interviewFocus: comparison.interviewFocus,
    candidates: comparison.candidates,
    provider: comparison.provider,
    model: comparison.model,
    generatedAt: comparison.generatedAt,
    createdAt: comparison.createdAt,
    updatedAt: comparison.updatedAt,
  };
};

const generateCandidateComparison = async ({
  userId,
  role,
  jobId,
  applicationIds,
}) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const uniqueApplicationIds = [
    ...new Set(
      (Array.isArray(applicationIds) ? applicationIds : []).map((value) =>
        String(value),
      ),
    ),
  ];

  if (uniqueApplicationIds.length < 2) {
    throw new ApiError(400, "Select at least 2 different applications");
  }

  if (
    uniqueApplicationIds.some(
      (applicationId) => !mongoose.isValidObjectId(applicationId),
    )
  ) {
    throw new ApiError(400, "Invalid application ID");
  }

  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to compare candidates",
  );

  const job = await Job.findOne({
    _id: jobId,
    companyId: company._id,
  }).lean();

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const aiConfig = getAiConfig();

  if (aiConfig.maxComparisonCandidates < 2) {
    throw new ApiError(503, "AI candidate comparison limit is not configured");
  }

  if (uniqueApplicationIds.length > aiConfig.maxComparisonCandidates) {
    throw new ApiError(
      400,
      `You can compare at most ${aiConfig.maxComparisonCandidates} candidates at a time`,
    );
  }

  const applications = await Application.find({
    _id: {
      $in: uniqueApplicationIds,
    },
    companyId: company._id,
    jobId: job._id,
  })
    .select("+matchSnapshot +resumeReviewSnapshot")
    .populate({
      path: "candidateId",
      select:
        "firstName lastName headline summary skills experienceLevel location resumeUrl targetJobTitles preferredLocations preferredWorkplaceTypes preferredEmploymentTypes",
    })
    .populate({
      path: "candidateUserId",
      select: "username email profilePhotoUrl",
    })
    .lean();

  if (applications.length !== uniqueApplicationIds.length) {
    throw new ApiError(
      404,
      "One or more applications were not found for this job",
    );
  }

  if (
    applications.some(
      (application) => !application.candidateId || !application.candidateUserId,
    )
  ) {
    throw new ApiError(
      400,
      "One or more applications have incomplete candidate data",
    );
  }

  await refreshApplicationMatchSnapshots({
    applications,
    job,
  });

  const jobSignature = buildJobMatchSignature(job);

  const selectedCandidates = sortComparisonCandidates(
    applications.map((application) =>
      buildComparisonCandidate({
        application,
        jobSignature,
      }),
    ),
  );

  const candidateSetSignature = buildCandidateSetSignature({
    jobSignature,
    candidates: selectedCandidates,
  });

  const cachedComparison = await CandidateComparison.findOne({
    jobId: job._id,
    jobSignature,
    candidateSetSignature,
  }).sort({
    generatedAt: -1,
  });

  if (cachedComparison) {
    return {
      reused: true,

      job: {
        _id: job._id,
        title: job.title,
      },

      comparison: formatCandidateComparison(cachedComparison),

      usage: await getAiUsageState({
        userId,
        featureKey: AI_FEATURE_KEYS.CANDIDATE_COMPARISON,
      }),
    };
  }

  const readyAiConfig = ensureAiProviderReady();

  const usage = await consumeAiUsage({
    userId,
    companyId: company._id,
    featureKey: AI_FEATURE_KEYS.CANDIDATE_COMPARISON,
  });

  const rawOutput = await generateAiJson({
    prompt: buildCandidateComparisonPrompt({
      job,
      candidates: selectedCandidates,
    }),

    systemInstruction: buildAiSystemInstruction("AI Candidate Comparison"),

    temperature: 0.2,
    maxOutputTokens: 3072,
  });

  const normalizedOutput = normalizeCandidateComparisonOutput({
    output: rawOutput,
    selectedCandidates,
  });

  let comparison;

  try {
    comparison = await CandidateComparison.create({
      companyId: company._id,
      jobId: job._id,
      generatedBy: userId,
      jobSignature,
      candidateSetSignature,
      applicationIds: selectedCandidates.map(
        (candidate) => candidate.applicationId,
      ),
      selectedCandidateCount: selectedCandidates.length,

      comparisonSummary: normalizedOutput.comparisonSummary,
      sharedStrengths: normalizedOutput.sharedStrengths,
      keyDifferences: normalizedOutput.keyDifferences,
      interviewFocus: normalizedOutput.interviewFocus,
      candidates: normalizedOutput.candidates,

      provider: readyAiConfig.provider,
      model: readyAiConfig.model,
      rawOutput,
      generatedAt: new Date(),
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    comparison = await CandidateComparison.findOne({
      jobId: job._id,
      jobSignature,
      candidateSetSignature,
    });

    if (!comparison) {
      throw error;
    }
  }

  return {
    reused: false,

    job: {
      _id: job._id,
      title: job.title,
    },

    comparison: formatCandidateComparison(comparison),

    usage,
  };
};

export {
  formatCandidateComparison,
  generateCandidateComparison,
  normalizeCandidateComparisonOutput,
};
