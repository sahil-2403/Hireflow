import mongoose from "mongoose";

const jobResumeFitSchema = new mongoose.Schema(
  {
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    candidateProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    resumeAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeAnalysis",
      required: true,
      index: true,
    },

    jobSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    resumeSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    enhancedMatchScore: {
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

    matchBasis: {
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

    matchedRequirements: {
      type: [String],
      default: [],
    },

    missingRequirements: {
      type: [String],
      default: [],
    },

    resumeImprovements: {
      type: [String],
      default: [],
    },

    profileImprovements: {
      type: [String],
      default: [],
    },

    beforeApplyingChecklist: {
      type: [String],
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

jobResumeFitSchema.index({
  candidateUserId: 1,
  jobId: 1,
  resumeAnalysisId: 1,
  jobSignature: 1,
  resumeSignature: 1,
});

const JobResumeFit =
  mongoose.models.JobResumeFit ||
  mongoose.model("JobResumeFit", jobResumeFitSchema);

export default JobResumeFit;
