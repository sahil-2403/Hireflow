import mongoose from "mongoose";

import {
  JOB_STATUS,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
} from "../../config/constants.js";

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 10000,
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    requirements: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
      index: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    employmentType: {
      type: String,
      required: true,
      enum: Object.values(EMPLOYMENT_TYPE),
    },

    workplaceType: {
      type: String,
      required: true,
      enum: Object.values(WORKPLACE_TYPE),
    },

    experienceLevel: {
      type: String,
      required: true,
      enum: Object.values(EXPERIENCE_LEVEL),
    },

    salaryMin: {
      type: Number,
      default: null,
      min: 0,
    },

    salaryMax: {
      type: Number,
      default: null,
      min: 0,
    },

    salaryCurrency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },

    isSalaryVisible: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.OPEN,
      index: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({
  companyId: 1,
  status: 1,
  createdAt: -1,
});

jobSchema.index({
  title: "text",
  description: "text",
  skills: "text",
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
