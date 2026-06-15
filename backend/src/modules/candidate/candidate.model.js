import mongoose from "mongoose";

import { EXPERIENCE_LEVEL } from "../../config/constants.js";

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 20,
    },

    headline: {
      type: String,
      default: null,
      trim: true,
      maxlength: 150,
    },

    summary: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },

    skills: {
      type: [String],
      default: [],
      index: true,
    },

    experienceLevel: {
      type: String,
      enum: Object.values(EXPERIENCE_LEVEL),
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    resumeUrl: {
      type: String,
      default: null,
      trim: true,
    },

    resumePublicId: {
      type: String,
      default: null,
      trim: true,
    },

    linkedinUrl: {
      type: String,
      default: null,
      trim: true,
    },

    githubUrl: {
      type: String,
      default: null,
      trim: true,
    },

    portfolioUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

candidateSchema.index({
  experienceLevel: 1,
  location: 1,
});

candidateSchema.index({
  firstName: "text",
  lastName: "text",
  headline: "text",
  skills: "text",
});

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
