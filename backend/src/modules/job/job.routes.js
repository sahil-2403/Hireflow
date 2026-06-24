import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";

import { ROLES } from "../../config/constants.js";

import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "./job.validation.js";

import {
  createJob,
  updateJob,
  updateJobStatus,
  listPublicJobs,
  getPublicJobById,
  listManagedJobs,
  getManagedJobById,
} from "./job.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: List public open jobs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: workplaceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - title
 *             - salaryMin
 *             - salaryMax
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *     responses:
 *       200:
 *         description: Paginated open jobs returned
 *       400:
 *         description: Invalid filter
 */
router.get("/", listPublicJobs);

/**
 * @openapi
 * /api/v1/jobs/manage:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: List jobs managed by the current company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - open
 *             - closed
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Managed jobs returned
 *       403:
 *         description: Owner or recruiter role required
 */
router.get(
  "/manage",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedJobs,
);

router.get(
  "/manage/:jobId",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getManagedJobById,
);

/**
 * @openapi
 * /api/v1/jobs:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Create a job
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - employmentType
 *               - workplaceType
 *               - experienceLevel
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               employmentType:
 *                 type: string
 *               workplaceType:
 *                 type: string
 *               experienceLevel:
 *                 type: string
 *               salaryMin:
 *                 type: number
 *                 nullable: true
 *               salaryMax:
 *                 type: number
 *                 nullable: true
 *               salaryCurrency:
 *                 type: string
 *                 example: INR
 *               isSalaryVisible:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Owner or recruiter role required
 */
router.post(
  "/",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(createJobSchema),
  createJob,
);

/**
 * @openapi
 * /api/v1/jobs/{jobId}:
 *   patch:
 *     tags:
 *       - Jobs
 *     summary: Update a company job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any supported job fields that should be updated
 *     responses:
 *       200:
 *         description: Job updated
 *       400:
 *         description: Validation failed or invalid job ID
 *       404:
 *         description: Job not found
 */
router.patch(
  "/:jobId",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateJobSchema),
  updateJob,
);

/**
 * @openapi
 * /api/v1/jobs/{jobId}/status:
 *   patch:
 *     tags:
 *       - Jobs
 *     summary: Open or close a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *                   - open
 *                   - closed
 *     responses:
 *       200:
 *         description: Job status updated
 *       404:
 *         description: Job not found
 */
router.patch(
  "/:jobId/status",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateJobStatusSchema),
  updateJobStatus,
);

/**
 * @openapi
 * /api/v1/jobs/{jobId}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get public details for an open job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Open job returned
 *       400:
 *         description: Invalid job ID
 *       404:
 *         description: Open job not found
 */
router.get("/:jobId", getPublicJobById);

export default router;
