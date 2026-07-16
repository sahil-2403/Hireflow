import mongoose from "mongoose";

import { getAiConfig } from "../../config/ai.js";
import {
  AI_FEATURE_KEYS,
  JOB_STATUS,
  RESUME_ANALYSIS_SOURCE_TYPES,
} from "../../config/constants.js";

import ApiError from "../../shared/errors/ApiError.js";

import Candidate from "../candidate/candidate.model.js";

import { consumeAiUsage, getAiUsageState } from "../aiUsage/aiUsage.service.js";

import Job from "../job/job.model.js";
import JobResumeFit from "../jobResumeFit/jobResumeFit.model.js";

import {
  buildJobMatchSignature,
  calculateJobCandidateMatch,
} from "../../shared/services/matchScore.service.js";

import {
  buildCandidateProfileResumeSource,
  completeResumeAnalysis,
  createPendingResumeAnalysis,
  failResumeAnalysis,
  findLatestCompletedResumeAnalysis,
  findLatestResumeAnalysis,
  isResumeAnalysisFreshForSource,
} from "../resumeAnalysis/resumeAnalysis.service.js";

import {
  buildAiSystemInstruction,
  buildJobResumeFitPrompt,
  buildResumeAnalysisPrompt,
} from "./aiPrompt.service.js";

import { ensureAiProviderReady, generateAiJson } from "./aiProvider.service.js";

const RESUME_DOWNLOAD_FAILED_MESSAGE =
  "Unable to download resume for AI analysis";

const toStringOrNull = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
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

const toScoreOrNull = (value) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.min(Math.max(Math.round(numberValue), 0), 100);
};

const normalizeProjects = (projects) => {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.map((project) => ({
    name: toStringOrNull(project?.name),
    description: toStringOrNull(project?.description),
    technologies: toStringArray(project?.technologies),
    impact: toStringOrNull(project?.impact),
    links: toStringArray(project?.links),
  }));
};

const normalizeExperience = (experience) => {
  if (!Array.isArray(experience)) {
    return [];
  }

  return experience.map((item) => ({
    title: toStringOrNull(item?.title),
    company: toStringOrNull(item?.company),
    duration: toStringOrNull(item?.duration),
    highlights: toStringArray(item?.highlights),
  }));
};

const normalizeEducation = (education) => {
  if (!Array.isArray(education)) {
    return [];
  }

  return education.map((item) => ({
    degree: toStringOrNull(item?.degree),
    institution: toStringOrNull(item?.institution),
    year: toStringOrNull(item?.year),
  }));
};

const normalizeResumeAnalysisOutput = (output) => {
  const extracted = output?.extracted || {};
  const evaluation = output?.evaluation || {};
  const recommendedProfileUpdates = evaluation?.recommendedProfileUpdates || {};

  return {
    extracted: {
      fullName: toStringOrNull(extracted.fullName),
      email: toStringOrNull(extracted.email),
      phone: toStringOrNull(extracted.phone),
      location: toStringOrNull(extracted.location),
      summary: toStringOrNull(extracted.summary),
      targetRoles: toStringArray(extracted.targetRoles),
      skills: toStringArray(extracted.skills),
      programmingLanguages: toStringArray(extracted.programmingLanguages),
      frameworks: toStringArray(extracted.frameworks),
      databases: toStringArray(extracted.databases),
      tools: toStringArray(extracted.tools),
      projects: normalizeProjects(extracted.projects),
      experience: normalizeExperience(extracted.experience),
      education: normalizeEducation(extracted.education),
      certifications: toStringArray(extracted.certifications),
      links: toStringArray(extracted.links),
    },

    evaluation: {
      resumeScore: toScoreOrNull(evaluation.resumeScore),
      strengths: toStringArray(evaluation.strengths),
      weaknesses: toStringArray(evaluation.weaknesses),
      missingKeywords: toStringArray(evaluation.missingKeywords),
      atsIssues: toStringArray(evaluation.atsIssues),
      improvementSuggestions: toStringArray(evaluation.improvementSuggestions),
      recommendedProfileUpdates: {
        headline: toStringOrNull(recommendedProfileUpdates.headline),
        summary: toStringOrNull(recommendedProfileUpdates.summary),
        skills: toStringArray(recommendedProfileUpdates.skills),
        targetJobTitles: toStringArray(
          recommendedProfileUpdates.targetJobTitles,
        ),
      },
    },
  };
};

const formatResumeAnalysis = (analysis) => {
  if (!analysis) {
    return null;
  }

  return {
    id: analysis._id.toString(),
    status: analysis.status,
    sourceType: analysis.sourceType,
    resumeUrl: analysis.resumeUrl,
    resumePublicId: analysis.resumePublicId,
    resumeSignature: analysis.resumeSignature,
    extracted: analysis.extracted,
    evaluation: analysis.evaluation,
    provider: analysis.provider,
    model: analysis.model,
    analyzedAt: analysis.analyzedAt,
    errorMessage: analysis.errorMessage,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
};

const downloadResumeAsGeminiPart = async (resumeUrl) => {
  let response;

  try {
    response = await fetch(resumeUrl);
  } catch {
    throw new ApiError(502, RESUME_DOWNLOAD_FAILED_MESSAGE);
  }

  if (!response.ok) {
    throw new ApiError(502, RESUME_DOWNLOAD_FAILED_MESSAGE);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new ApiError(400, "Resume file is empty");
  }

  return {
    inlineData: {
      mimeType: "application/pdf",
      data: buffer.toString("base64"),
    },
  };
};

const getCandidateProfileForAi = async (userId) => {
  const candidateProfile = await Candidate.findOne({
    userId,
  });

  if (!candidateProfile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  return candidateProfile;
};

const getMyCandidateResumeAnalysis = async (userId) => {
  const candidateProfile = await getCandidateProfileForAi(userId);

  if (!candidateProfile.resumeUrl) {
    return {
      hasResume: false,
      isFresh: false,
      analysis: null,
      usage: await getAiUsageState({
        userId,
        featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
      }),
    };
  }

  const resumeSource = buildCandidateProfileResumeSource(candidateProfile);

  const latestAnalysis = await findLatestResumeAnalysis({
    candidateUserId: userId,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
  });

  return {
    hasResume: true,
    isFresh: isResumeAnalysisFreshForSource(latestAnalysis, resumeSource),
    analysis: formatResumeAnalysis(latestAnalysis),
    usage: await getAiUsageState({
      userId,
      featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
    }),
  };
};

const analyzeMyCandidateResume = async (userId) => {
  const candidateProfile = await getCandidateProfileForAi(userId);
  const resumeSource = buildCandidateProfileResumeSource(candidateProfile);

  const existingAnalysis = await findLatestCompletedResumeAnalysis({
    candidateUserId: userId,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
    resumeSignature: resumeSource.resumeSignature,
  });

  if (existingAnalysis) {
    return {
      reused: true,
      analysis: formatResumeAnalysis(existingAnalysis),
      usage: await getAiUsageState({
        userId,
        featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
      }),
    };
  }

  const aiConfig = ensureAiProviderReady();

  const usage = await consumeAiUsage({
    userId,
    featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
  });

  const pendingAnalysis = await createPendingResumeAnalysis({
    resumeSource,
    provider: aiConfig.provider,
    model: aiConfig.model,
  });

  try {
    const resumePart = await downloadResumeAsGeminiPart(resumeSource.resumeUrl);

    const rawOutput = await generateAiJson({
      parts: [
        {
          text: buildResumeAnalysisPrompt({
            candidateProfile,
          }),
        },
        resumePart,
      ],
      systemInstruction: buildAiSystemInstruction("AI Resume Insights"),
      temperature: 0.2,
      maxOutputTokens: 4096,
    });

    const normalizedOutput = normalizeResumeAnalysisOutput(rawOutput);

    const completedAnalysis = await completeResumeAnalysis({
      analysisId: pendingAnalysis._id,
      extracted: normalizedOutput.extracted,
      evaluation: normalizedOutput.evaluation,
      rawOutput,
      provider: aiConfig.provider,
      model: aiConfig.model,
    });

    return {
      reused: false,
      analysis: formatResumeAnalysis(completedAnalysis),
      usage,
    };
  } catch (error) {
    await failResumeAnalysis({
      analysisId: pendingAnalysis._id,
      errorMessage: error.message,
    });

    throw error;
  }
};

const JOB_RESUME_FIT_REQUIRED_MESSAGE =
  "Generate AI Resume Insights before checking AI Resume Fit for this job";

const normalizeJobResumeFitOutput = (output) => {
  return {
    summary:
      toStringOrNull(output?.summary) ||
      "Your resume fit has been reviewed for this job.",
    matchedRequirements: toStringArray(output?.matchedRequirements),
    missingRequirements: toStringArray(output?.missingRequirements),
    resumeImprovements: toStringArray(output?.resumeImprovements),
    profileImprovements: toStringArray(output?.profileImprovements),
    beforeApplyingChecklist: toStringArray(output?.beforeApplyingChecklist),
  };
};

const formatJobResumeFit = (fit) => {
  if (!fit) {
    return null;
  }

  return {
    id: fit._id.toString(),
    jobId: fit.jobId.toString(),
    resumeAnalysisId: fit.resumeAnalysisId.toString(),
    enhancedMatchScore: fit.enhancedMatchScore,
    matchLabel: fit.matchLabel,
    matchBasis: fit.matchBasis,
    profileScore: fit.profileScore,
    resumeBoost: fit.resumeBoost,
    confidenceScore: fit.confidenceScore,
    confidenceLevel: fit.confidenceLevel,
    matchedSkills: fit.matchedSkills,
    missingSkills: fit.missingSkills,
    resumeEvidence: fit.resumeEvidence,
    summary: fit.summary,
    matchedRequirements: fit.matchedRequirements,
    missingRequirements: fit.missingRequirements,
    resumeImprovements: fit.resumeImprovements,
    profileImprovements: fit.profileImprovements,
    beforeApplyingChecklist: fit.beforeApplyingChecklist,
    provider: fit.provider,
    model: fit.model,
    generatedAt: fit.generatedAt,
    createdAt: fit.createdAt,
    updatedAt: fit.updatedAt,
  };
};

const getOpenJobForAiResumeFit = async (jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: jobId,
    status: JOB_STATUS.OPEN,
  }).lean();

  if (!job) {
    throw new ApiError(404, "Open job not found");
  }

  return job;
};

const checkMyCandidateJobResumeFit = async ({ userId, jobId }) => {
  const candidateProfile = await getCandidateProfileForAi(userId);
  const resumeSource = buildCandidateProfileResumeSource(candidateProfile);

  const resumeAnalysis = await findLatestCompletedResumeAnalysis({
    candidateUserId: userId,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
    resumeSignature: resumeSource.resumeSignature,
  });

  if (!resumeAnalysis) {
    throw new ApiError(400, JOB_RESUME_FIT_REQUIRED_MESSAGE);
  }

  const job = await getOpenJobForAiResumeFit(jobId);
  const jobSignature = buildJobMatchSignature(job);

  const cachedFit = await JobResumeFit.findOne({
    candidateUserId: userId,
    jobId: job._id,
    resumeAnalysisId: resumeAnalysis._id,
    jobSignature,
    resumeSignature: resumeSource.resumeSignature,
  }).sort({
    generatedAt: -1,
  });

  if (cachedFit) {
    return {
      reused: true,
      job: {
        _id: job._id,
        title: job.title,
      },
      fit: formatJobResumeFit(cachedFit),
      usage: await getAiUsageState({
        userId,
        featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
      }),
    };
  }

  const aiConfig = ensureAiProviderReady();

  const usage = await consumeAiUsage({
    userId,
    featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
  });

  const candidateForMatch = candidateProfile.toObject
    ? candidateProfile.toObject()
    : candidateProfile;

  const deterministicMatch = calculateJobCandidateMatch(
    job,
    candidateForMatch,
    {
      resumeAnalysis,
    },
  );

  const rawOutput = await generateAiJson({
    prompt: buildJobResumeFitPrompt({
      candidateProfile: candidateForMatch,
      job,
      resumeAnalysis,
      match: deterministicMatch,
    }),
    systemInstruction: buildAiSystemInstruction("AI Resume Fit for This Job"),
    temperature: 0.2,
    maxOutputTokens: 2048,
  });

  const normalizedOutput = normalizeJobResumeFitOutput(rawOutput);

  const fit = await JobResumeFit.create({
    candidateUserId: candidateProfile.userId,
    candidateProfileId: candidateProfile._id,
    jobId: job._id,
    resumeAnalysisId: resumeAnalysis._id,
    jobSignature,
    resumeSignature: resumeSource.resumeSignature,

    enhancedMatchScore: deterministicMatch.matchScore,
    matchLabel: deterministicMatch.matchLabel,
    matchBasis: deterministicMatch.matchBasis,
    profileScore: deterministicMatch.profileScore,
    resumeBoost: deterministicMatch.resumeBoost,
    confidenceScore: deterministicMatch.confidenceScore,
    confidenceLevel: deterministicMatch.confidenceLevel,
    matchedSkills: deterministicMatch.matchedSkills,
    missingSkills: deterministicMatch.missingSkills,
    resumeEvidence: deterministicMatch.resumeEvidence,

    summary: normalizedOutput.summary,
    matchedRequirements: normalizedOutput.matchedRequirements,
    missingRequirements: normalizedOutput.missingRequirements,
    resumeImprovements: normalizedOutput.resumeImprovements,
    profileImprovements: normalizedOutput.profileImprovements,
    beforeApplyingChecklist: normalizedOutput.beforeApplyingChecklist,

    provider: aiConfig.provider,
    model: aiConfig.model,
    rawOutput,
    generatedAt: new Date(),
  });

  return {
    reused: false,
    job: {
      _id: job._id,
      title: job.title,
    },
    fit: formatJobResumeFit(fit),
    usage,
  };
};

export {
  analyzeMyCandidateResume,
  getMyCandidateResumeAnalysis,
  checkMyCandidateJobResumeFit,
  normalizeResumeAnalysisOutput,
  normalizeJobResumeFitOutput,
  formatResumeAnalysis,
  formatJobResumeFit,
};
