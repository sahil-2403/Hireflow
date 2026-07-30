import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";

import { ROLES } from "../../config/constants.js";

import {
  applyToJobSchema,
  updateApplicationStatusSchema,
} from "./application.validation.js";

import {
  applyToJob,
  listMyApplications,
  listManagedApplications,
  listManagedApplicationJobs,
  listManagedJobApplications,
  getMyApplicationSummary,
  getManagedJobApplicationDetails,
  updateApplicationStatus,
  viewManagedApplicationResume,
} from "./application.controller.js";
const router = express.Router();

/**
 * @openapi
 * /api/v1/applications/jobs/{jobId}/apply:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Apply to an open job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Profile or resume is incomplete
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Open job not found
 *       409:
 *         description: Candidate already applied
 */
router.post(
  "/jobs/:jobId/apply",
  authenticate,
  authorize(ROLES.CANDIDATE),
  validate(applyToJobSchema),
  applyToJob,
);

/**
 * @openapi
 * /api/v1/applications/me/summary:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Get the authenticated candidate's application summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate application summary returned
 *       403:
 *         description: Candidate role required
 */
router.get(
  "/me/summary",
  authenticate,
  authorize(ROLES.CANDIDATE),
  getMyApplicationSummary,
);

/**
 * @openapi
 * /api/v1/applications/me:
 *   get:
 *     tags:
 *       - Applications
 *     summary: List the authenticated candidate's applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Candidate applications returned
 *       403:
 *         description: Candidate role required
 */
router.get("/me", authenticate, authorize(ROLES.CANDIDATE), listMyApplications);

/**
 * @openapi
 * /api/v1/applications/manage:
 *   get:
 *     tags:
 *       - Applications
 *     summary: List company applications for owners and recruiters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Company applications returned
 *       400:
 *         description: Invalid filter
 *       403:
 *         description: Owner or recruiter role required
 */
router.get(
  "/manage",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedApplications,
);

router.get(
  "/manage/jobs",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedApplicationJobs,
);

router.get(
  "/manage/jobs/:jobId/applications",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedJobApplications,
);

router.get(
  "/manage/jobs/:jobId/applications/:applicationId",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getManagedJobApplicationDetails,
);

router.get(
  "/manage/:applicationId/resume/view",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  viewManagedApplicationResume,
);

/**
 * @openapi
 * /api/v1/applications/{applicationId}/status:
 *   patch:
 *     tags:
 *       - Applications
 *     summary: Move an application through the hiring workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - applied
 *                   - screening
 *                   - interview
 *                   - offer
 *                   - hired
 *                   - rejected
 *     responses:
 *       200:
 *         description: Application status updated
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Owner or recruiter role required
 *       404:
 *         description: Application not found
 */
router.patch(
  "/:applicationId/status",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

export default router;
