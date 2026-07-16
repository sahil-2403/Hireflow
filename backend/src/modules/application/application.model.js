import mongoose from "mongoose";

import { APPLICATION_STATUS } from "../../config/constants.js";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const matchSnapshotSchema = new mongoose.Schema(
  {
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    matchLabel: {
      type: String,
      required: true,
      trim: true,
    },

    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    confidenceLevel: {
      type: String,
      required: true,
      trim: true,
    },

    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    extraCandidateSkills: {
      type: [String],
      default: [],
    },

    reasons: {
      type: [String],
      default: [],
    },

    warnings: {
      type: [String],
      default: [],
    },

    engineVersion: {
      type: String,
      required: true,
      trim: true,
    },

    jobSignature: {
      type: String,
      required: true,
      trim: true,
    },

    candidateSignature: {
      type: String,
      required: true,
      trim: true,
    },

    calculatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const resumeMatchedEvidenceSchema = new mongoose.Schema(
  {
    requirement: {
      type: String,
      default: null,
      trim: true,
    },

    evidence: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const resumeReviewSnapshotSchema = new mongoose.Schema(
  {
    resumeAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
      default: null,
    },

    enhancedMatchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    matchBasis: {
      type: String,
      required: true,
      trim: true,
    },

    alignmentLevel: {
      type: String,
      required: true,
      trim: true,
    },

    profileScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    resumeBoost: {
      type: Number,
      default: 0,
      min: 0,
    },

    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    confidenceLevel: {
      type: String,
      required: true,
      trim: true,
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    resumeEvidence: {
      type: [String],
      default: [],
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    matchedEvidence: {
      type: [resumeMatchedEvidenceSchema],
      default: [],
    },

    missingOrWeakAreas: {
      type: [String],
      default: [],
    },

    resumeStrengths: {
      type: [String],
      default: [],
    },

    interviewFocus: {
      type: [String],
      default: [],
    },

    riskNotes: {
      type: [String],
      default: [],
    },

    jobSignature: {
      type: String,
      required: true,
      trim: true,
    },

    resumeSignature: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      default: null,
      trim: true,
    },

    model: {
      type: String,
      default: null,
      trim: true,
    },

    rawOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },

    generatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    coverLetter: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000,
    },

    resumeUrl: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    matchSnapshot: {
      type: matchSnapshotSchema,
      default: null,
      select: false,
    },

    resumeReviewSnapshot: {
      type: resumeReviewSnapshotSchema,
      default: null,
      select: false,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index(
  {
    jobId: 1,
    candidateUserId: 1,
  },
  {
    unique: true,
  },
);

applicationSchema.index({
  companyId: 1,
  status: 1,
  appliedAt: -1,
});

applicationSchema.index({
  candidateUserId: 1,
  appliedAt: -1,
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;
