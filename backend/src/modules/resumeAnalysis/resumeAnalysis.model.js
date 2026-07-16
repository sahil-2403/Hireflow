import mongoose from "mongoose";

import {
  RESUME_ANALYSIS_SOURCE_TYPES,
  RESUME_ANALYSIS_STATUS,
} from "../../config/constants.js";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
      trim: true,
    },

    description: {
      type: String,
      default: null,
      trim: true,
    },

    technologies: {
      type: [String],
      default: [],
    },

    impact: {
      type: String,
      default: null,
      trim: true,
    },

    links: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: null,
      trim: true,
    },

    company: {
      type: String,
      default: null,
      trim: true,
    },

    duration: {
      type: String,
      default: null,
      trim: true,
    },

    highlights: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      default: null,
      trim: true,
    },

    institution: {
      type: String,
      default: null,
      trim: true,
    },

    year: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const extractedResumeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      default: null,
      trim: true,
    },

    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    location: {
      type: String,
      default: null,
      trim: true,
    },

    summary: {
      type: String,
      default: null,
      trim: true,
    },

    targetRoles: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
      index: true,
    },

    programmingLanguages: {
      type: [String],
      default: [],
    },

    frameworks: {
      type: [String],
      default: [],
    },

    databases: {
      type: [String],
      default: [],
    },

    tools: {
      type: [String],
      default: [],
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    links: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const recommendedProfileUpdatesSchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      default: null,
      trim: true,
    },

    summary: {
      type: String,
      default: null,
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    targetJobTitles: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const resumeEvaluationSchema = new mongoose.Schema(
  {
    resumeScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    missingKeywords: {
      type: [String],
      default: [],
    },

    atsIssues: {
      type: [String],
      default: [],
    },

    improvementSuggestions: {
      type: [String],
      default: [],
    },

    recommendedProfileUpdates: {
      type: recommendedProfileUpdatesSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  },
);

const resumeAnalysisSchema = new mongoose.Schema(
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

    sourceType: {
      type: String,
      enum: Object.values(RESUME_ANALYSIS_SOURCE_TYPES),
      required: true,
      index: true,
    },

    resumeUrl: {
      type: String,
      required: true,
      trim: true,
    },

    resumePublicId: {
      type: String,
      default: null,
      trim: true,
    },

    resumeSignature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(RESUME_ANALYSIS_STATUS),
      default: RESUME_ANALYSIS_STATUS.PENDING,
      index: true,
    },

    extracted: {
      type: extractedResumeSchema,
      default: () => ({}),
    },

    evaluation: {
      type: resumeEvaluationSchema,
      default: () => ({}),
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

    analyzedAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

resumeAnalysisSchema.index({
  candidateUserId: 1,
  sourceType: 1,
  resumeSignature: 1,
  createdAt: -1,
});

resumeAnalysisSchema.index({
  candidateProfileId: 1,
  createdAt: -1,
});

resumeAnalysisSchema.index({
  status: 1,
  createdAt: -1,
});

const ResumeAnalysis =
  mongoose.models.ResumeAnalysis ||
  mongoose.model("ResumeAnalysis", resumeAnalysisSchema);

export default ResumeAnalysis;
