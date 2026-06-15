import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";
import { uploadResume } from "../../shared/middleware/upload.js";

import { ROLES } from "../../config/constants.js";

import {
  createCandidateProfileSchema,
  updateCandidateProfileSchema,
} from "./candidate.validation.js";

import {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
} from "./candidate.controller.js";

const router = express.Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));

router.post(
  "/profile",
  validate(createCandidateProfileSchema),
  createCandidateProfile,
);

router.get("/profile", getMyCandidateProfile);

router.patch(
  "/profile",
  validate(updateCandidateProfileSchema),
  updateCandidateProfile,
);

router.patch("/profile/resume", uploadResume, uploadCandidateResume);

export default router;
