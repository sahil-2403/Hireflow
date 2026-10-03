import mongoose from "mongoose";

import { hashPassword, comparePassword } from "../../shared/utils/password.js";
import { AUTH_PROVIDERS, ROLES } from "../../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required() {
        return this.authProvider === AUTH_PROVIDERS.LOCAL;
      },
      minlength: 8,
      select: false,
    },

    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      required: true,
      default: AUTH_PROVIDERS.LOCAL,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      required() {
        return this.authProvider === AUTH_PROVIDERS.GOOGLE;
      },
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CANDIDATE,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    profilePhotoUrl: {
      type: String,
      default: null,
      trim: true,
    },

    profilePhotoPublicId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  this.password = await hashPassword(this.password);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
