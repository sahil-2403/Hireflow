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
  viewCandidateResume,
} from "./candidate.controller.js";

const router = express.Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));

router.get("/profile/resume/view", viewCandidateResume);

/**
 * @openapi
 * /api/v1/candidates/profile:
 *   post:
 *     tags:
 *       - Candidates
 *     summary: Create the authenticated candidate profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - experienceLevel
 *               - location
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *               headline:
 *                 type: string
 *                 nullable: true
 *               summary:
 *                 type: string
 *                 nullable: true
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceLevel:
 *                 type: string
 *               location:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *                 nullable: true
 *               githubUrl:
 *                 type: string
 *                 nullable: true
 *               portfolioUrl:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Candidate profile created
 *       403:
 *         description: Candidate role required
 *       409:
 *         description: Candidate profile already exists
 */
router.post(
  "/profile",
  validate(createCandidateProfileSchema),
  createCandidateProfile,
);

/**
 * @openapi
 * /api/v1/candidates/profile:
 *   get:
 *     tags:
 *       - Candidates
 *     summary: Get the authenticated candidate profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate profile returned
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Candidate profile not found
 */
router.get("/profile", getMyCandidateProfile);

/**
 * @openapi
 * /api/v1/candidates/profile:
 *   patch:
 *     tags:
 *       - Candidates
 *     summary: Update the authenticated candidate profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Candidate profile fields to update
 *     responses:
 *       200:
 *         description: Candidate profile updated
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Candidate profile not found
 */
router.patch(
  "/profile",
  validate(updateCandidateProfileSchema),
  updateCandidateProfile,
);

/**
 * @openapi
 * /api/v1/candidates/profile/resume:
 *   patch:
 *     tags:
 *       - Uploads
 *     summary: Upload or replace the candidate resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: PDF file up to 5 MB
 *     responses:
 *       200:
 *         description: Resume uploaded
 *       400:
 *         description: Invalid or missing PDF file
 *       403:
 *         description: Candidate role required
 *       404:
 *         description: Candidate profile not found
 */
router.patch("/profile/resume", uploadResume, uploadCandidateResume);

export default router;
