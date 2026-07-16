import crypto from "crypto";
import mongoose from "mongoose";

import {
  RESUME_ANALYSIS_SOURCE_TYPES,
  RESUME_ANALYSIS_STATUS,
} from "../../config/constants.js";

import ApiError from "../../shared/errors/ApiError.js";

import ResumeAnalysis from "./resumeAnalysis.model.js";

const RESUME_REQUIRED_MESSAGE = "Resume file is required";

const normalizeObjectId = (value, fieldName) => {
  if (!value) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(value);
};

const createResumeSignature = ({ resumeUrl, resumePublicId = null }) => {
  if (!resumeUrl) {
    throw new ApiError(400, RESUME_REQUIRED_MESSAGE);
  }

  const signatureSource = JSON.stringify({
    resumeUrl,
    resumePublicId: resumePublicId || null,
  });

  return crypto.createHash("sha256").update(signatureSource).digest("hex");
};

const buildCandidateProfileResumeSource = (candidateProfile) => {
  if (!candidateProfile?.resumeUrl) {
    throw new ApiError(400, RESUME_REQUIRED_MESSAGE);
  }

  return {
    candidateUserId: candidateProfile.userId,
    candidateProfileId: candidateProfile._id,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
    resumeUrl: candidateProfile.resumeUrl,
    resumePublicId: candidateProfile.resumePublicId || null,
    resumeSignature: createResumeSignature({
      resumeUrl: candidateProfile.resumeUrl,
      resumePublicId: candidateProfile.resumePublicId,
    }),
  };
};

const buildApplicationResumeSource = (application) => {
  if (!application?.resumeUrl) {
    throw new ApiError(400, RESUME_REQUIRED_MESSAGE);
  }

  return {
    candidateUserId: application.candidateUserId,
    candidateProfileId: application.candidateId,
    sourceType: RESUME_ANALYSIS_SOURCE_TYPES.APPLICATION_RESUME,
    resumeUrl: application.resumeUrl,
    resumePublicId: null,
    resumeSignature: createResumeSignature({
      resumeUrl: application.resumeUrl,
      resumePublicId: null,
    }),
  };
};

const createPendingResumeAnalysis = async ({
  resumeSource,
  provider = null,
  model = null,
}) => {
  const analysis = await ResumeAnalysis.create({
    candidateUserId: normalizeObjectId(
      resumeSource.candidateUserId,
      "candidate user ID",
    ),

    candidateProfileId: normalizeObjectId(
      resumeSource.candidateProfileId,
      "candidate profile ID",
    ),

    sourceType: resumeSource.sourceType,
    resumeUrl: resumeSource.resumeUrl,
    resumePublicId: resumeSource.resumePublicId || null,
    resumeSignature: resumeSource.resumeSignature,
    status: RESUME_ANALYSIS_STATUS.PENDING,
    provider,
    model,
  });

  return analysis;
};

const completeResumeAnalysis = async ({
  analysisId,
  extracted = {},
  evaluation = {},
  rawOutput = null,
  provider = null,
  model = null,
}) => {
  const analysis = await ResumeAnalysis.findByIdAndUpdate(
    normalizeObjectId(analysisId, "resume analysis ID"),
    {
      $set: {
        status: RESUME_ANALYSIS_STATUS.COMPLETED,
        extracted,
        evaluation,
        rawOutput,
        provider,
        model,
        analyzedAt: new Date(),
        errorMessage: null,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!analysis) {
    throw new ApiError(404, "Resume analysis not found");
  }

  return analysis;
};

const failResumeAnalysis = async ({ analysisId, errorMessage }) => {
  const analysis = await ResumeAnalysis.findByIdAndUpdate(
    normalizeObjectId(analysisId, "resume analysis ID"),
    {
      $set: {
        status: RESUME_ANALYSIS_STATUS.FAILED,
        errorMessage: errorMessage || "Resume analysis failed",
        analyzedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!analysis) {
    throw new ApiError(404, "Resume analysis not found");
  }

  return analysis;
};

const findLatestResumeAnalysis = async ({
  candidateUserId,
  sourceType,
  resumeSignature = null,
  status = null,
}) => {
  const query = {
    candidateUserId: normalizeObjectId(candidateUserId, "candidate user ID"),
    sourceType,
  };

  if (resumeSignature) {
    query.resumeSignature = resumeSignature;
  }

  if (status) {
    query.status = status;
  }

  return ResumeAnalysis.findOne(query).sort({
    createdAt: -1,
  });
};

const findLatestCompletedResumeAnalysis = async ({
  candidateUserId,
  sourceType,
  resumeSignature = null,
}) => {
  return findLatestResumeAnalysis({
    candidateUserId,
    sourceType,
    resumeSignature,
    status: RESUME_ANALYSIS_STATUS.COMPLETED,
  });
};

const isResumeAnalysisFreshForSource = (analysis, resumeSource) => {
  if (!analysis || !resumeSource) {
    return false;
  }

  return (
    analysis.resumeSignature === resumeSource.resumeSignature &&
    analysis.sourceType === resumeSource.sourceType &&
    analysis.status === RESUME_ANALYSIS_STATUS.COMPLETED
  );
};

export {
  createResumeSignature,
  buildCandidateProfileResumeSource,
  buildApplicationResumeSource,
  createPendingResumeAnalysis,
  completeResumeAnalysis,
  failResumeAnalysis,
  findLatestResumeAnalysis,
  findLatestCompletedResumeAnalysis,
  isResumeAnalysisFreshForSource,
};
