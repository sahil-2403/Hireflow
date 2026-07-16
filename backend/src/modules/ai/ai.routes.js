import express from "express";

import { ROLES } from "../../config/constants.js";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import {
  analyzeCandidateResume,
  getCandidateResumeAnalysis,
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

export default router;
