import mongoose from "mongoose";

import { AI_FEATURE_KEYS } from "../../config/constants.js";

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    featureKey: {
      type: String,
      required: true,
      enum: Object.values(AI_FEATURE_KEYS),
      index: true,
    },

    dateKey: {
      type: String,
      required: true,
      index: true,
    },

    count: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

aiUsageSchema.index(
  {
    userId: 1,
    featureKey: 1,
    dateKey: 1,
  },
  {
    unique: true,
  },
);

const AiUsage =
  mongoose.models.AiUsage || mongoose.model("AiUsage", aiUsageSchema);

export default AiUsage;
