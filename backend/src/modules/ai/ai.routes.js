import express from "express";

import { ROLES } from "../../config/constants.js";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import {
  analyzeCandidateResume,
  checkCandidateJobResumeFit,
  getCandidateResumeAnalysis,
  reviewApplicationResumeMatch,
} from "./ai.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/candidates/resume/analyze",
  authorize(ROLES.CANDIDATE),
  analyzeCandidateResume,
);

router.get(
  "/candidates/resume/analysis",
  authorize(ROLES.CANDIDATE),
  getCandidateResumeAnalysis,
);

router.post(
  "/jobs/:jobId/resume-fit",
  authorize(ROLES.CANDIDATE),
  checkCandidateJobResumeFit,
);

router.post(
  "/applications/:applicationId/resume-review",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  reviewApplicationResumeMatch,
);

export default router;
