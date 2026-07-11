import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import { ROLES } from "../../config/constants.js";

import {
  getCompanyOverview,
  getHiringFunnel,
  getTopJobs,
  getTopApplicantsByLatestJobs,
  getCandidateOverview,
} from "./analytics.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/analytics/company/overview:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get company dashboard overview
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company overview returned
 *       403:
 *         description: Owner or recruiter role required
 */
router.get(
  "/company/overview",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getCompanyOverview,
);

/**
 * @openapi
 * /api/v1/analytics/company/hiring-funnel:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get application counts by hiring stage
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hiring funnel returned
 */
router.get(
  "/company/hiring-funnel",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getHiringFunnel,
);

/**
 * @openapi
 * /api/v1/analytics/company/top-jobs:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get jobs ranked by application count
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Top jobs returned
 */
router.get(
  "/company/top-jobs",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getTopJobs,
);

router.get(
  "/company/top-applicants",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getTopApplicantsByLatestJobs,
);

/**
 * @openapi
 * /api/v1/analytics/candidate/overview:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get candidate dashboard overview
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate overview returned
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Candidate profile not found
 */
router.get(
  "/candidate/overview",
  authenticate,
  authorize(ROLES.CANDIDATE),
  getCandidateOverview,
);

export default router;
