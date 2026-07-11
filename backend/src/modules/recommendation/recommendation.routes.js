import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import { ROLES } from "../../config/constants.js";

import {
  getRecommendedJobMatch,
  listRecommendedJobs,
} from "./recommendation.controller.js";

const router = express.Router();

router.get(
  "/jobs",
  authenticate,
  authorize(ROLES.CANDIDATE),
  listRecommendedJobs,
);

router.get(
  "/jobs/:jobId/match",
  authenticate,
  authorize(ROLES.CANDIDATE),
  getRecommendedJobMatch,
);

export default router;
