import mongoose from "mongoose";

import { COMPANY_SIZE } from "../../config/constants.js";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    logoUrl: {
      type: String,
      default: null,
      trim: true,
    },

    logoPublicId: {
      type: String,
      default: null,
      trim: true,
    },

    industry: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    companySize: {
      type: String,
      required: true,
      enum: Object.values(COMPANY_SIZE),
    },

    websiteUrl: {
      type: String,
      default: null,
      trim: true,
    },

    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },

    headquarters: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model("Company", companySchema);

export default Company;
