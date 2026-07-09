import mongoose from "mongoose";

const companyOwnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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

    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
);

const CompanyOwner = mongoose.model("CompanyOwner", companyOwnerSchema);

export default CompanyOwner;
