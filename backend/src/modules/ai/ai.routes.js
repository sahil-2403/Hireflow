import express from "express";

import { ROLES } from "../../config/constants.js";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import validate from "../../shared/middleware/validate.js";

import {
  candidateComparisonSchema,
  jobPostSuggestionSchema,
  suggestedShortlistSchema,
} from "./ai.validation.js";

import {
  analyzeCandidateResume,
  checkCandidateJobResumeFit,
  generateApplicationInterviewKit,
  generateJobCandidateComparison,
  generateJobPostSuggestions,
  generateJobSuggestedShortlist,
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
  "/jobs/post-suggestions",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(jobPostSuggestionSchema),
  generateJobPostSuggestions,
);

router.post(
  "/jobs/:jobId/suggested-shortlist",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(suggestedShortlistSchema),
  generateJobSuggestedShortlist,
);

router.post(
  "/jobs/:jobId/candidate-comparison",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(candidateComparisonSchema),
  generateJobCandidateComparison,
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

router.post(
  "/applications/:applicationId/interview-kit",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  generateApplicationInterviewKit,
);

export default router;
