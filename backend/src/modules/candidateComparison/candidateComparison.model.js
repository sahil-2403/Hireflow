import mongoose from "mongoose";

const comparedCandidateSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    candidateName: {
      type: String,
      required: true,
      trim: true,
    },

    headline: {
      type: String,
      default: null,
      trim: true,
    },

    applicationStatus: {
      type: String,
      required: true,
      trim: true,
    },

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
      default: null,
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

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    strongestEvidence: {
      type: [String],
      default: [],
    },

    concernsToVerify: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const candidateComparisonSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    jobSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    candidateSetSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    applicationIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Application",
        },
      ],
      required: true,
    },

    selectedCandidateCount: {
      type: Number,
      required: true,
      min: 2,
    },

    comparisonSummary: {
      type: String,
      required: true,
      trim: true,
    },

    sharedStrengths: {
      type: [String],
      default: [],
    },

    keyDifferences: {
      type: [String],
      default: [],
    },

    interviewFocus: {
      type: [String],
      default: [],
    },

    candidates: {
      type: [comparedCandidateSchema],
      default: [],
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
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

candidateComparisonSchema.index(
  {
    jobId: 1,
    jobSignature: 1,
    candidateSetSignature: 1,
  },
  {
    unique: true,
  },
);

const CandidateComparison =
  mongoose.models.CandidateComparison ||
  mongoose.model("CandidateComparison", candidateComparisonSchema);

export default CandidateComparison;
