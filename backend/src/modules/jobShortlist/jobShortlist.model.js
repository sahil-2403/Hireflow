import mongoose from "mongoose";

const shortlistedCandidateSchema = new mongoose.Schema(
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

    strengths: {
      type: [String],
      default: [],
    },

    verificationPoints: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const jobShortlistSchema = new mongoose.Schema(
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

    requestedLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    totalEligibleCandidates: {
      type: Number,
      required: true,
      min: 1,
    },

    candidates: {
      type: [shortlistedCandidateSchema],
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

jobShortlistSchema.index(
  {
    jobId: 1,
    jobSignature: 1,
    candidateSetSignature: 1,
    requestedLimit: 1,
  },
  {
    unique: true,
  },
);

const JobShortlist =
  mongoose.models.JobShortlist ||
  mongoose.model("JobShortlist", jobShortlistSchema);

export default JobShortlist;
