import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";
import { uploadCompanyLogo as uploadCompanyLogoFile } from "../../shared/middleware/upload.js";

import { ROLES } from "../../config/constants.js";

import {
  createCompanySchema,
  updateCompanySchema,
  createRecruiterSchema,
  updateRecruiterStatusSchema,
} from "./company.validation.js";

import {
  createCompany,
  updateCompany,
  getMyCompany,
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
  uploadCompanyLogo,
} from "./company.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/company:
 *   get:
 *     tags:
 *       - Company
 *     summary: Get the current user's company profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current company profile returned
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Owner or recruiter role required
 *       404:
 *         description: Company profile not found
 */
router.get(
  "/",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getMyCompany,
);

/**
 * @openapi
 * /api/v1/company:
 *   post:
 *     tags:
 *       - Company
 *     summary: Create the company profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - industry
 *               - companySize
 *               - headquarters
 *             properties:
 *               name:
 *                 type: string
 *                 example: HireFlow Technologies
 *               industry:
 *                 type: string
 *                 example: Software Development
 *               companySize:
 *                 type: string
 *                 example: 11-50
 *               websiteUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com
 *               description:
 *                 type: string
 *                 nullable: true
 *               headquarters:
 *                 type: string
 *                 example: Pune, Maharashtra
 *     responses:
 *       201:
 *         description: Company profile created
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Owner role required
 *       409:
 *         description: Company already exists
 */
router.post(
  "/",
  authenticate,
  authorize(ROLES.OWNER),
  validate(createCompanySchema),
  createCompany,
);

/**
 * @openapi
 * /api/v1/company:
 *   patch:
 *     tags:
 *       - Company
 *     summary: Update the company profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               companySize:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               headquarters:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company profile updated
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Owner role required
 *       404:
 *         description: Company profile not found
 */
router.patch(
  "/",
  authenticate,
  authorize(ROLES.OWNER),
  validate(updateCompanySchema),
  updateCompany,
);

/**
 * @openapi
 * /api/v1/company/recruiters:
 *   post:
 *     tags:
 *       - Company
 *     summary: Create an internal recruiter account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - jobTitle
 *             properties:
 *               username:
 *                 type: string
 *                 example: recruiter_one
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 example: Recruiter123
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *                 example: Technical Recruiter
 *     responses:
 *       201:
 *         description: Recruiter created
 *       403:
 *         description: Owner role required
 *       409:
 *         description: Username or email already exists
 */
router.post(
  "/recruiters",
  authenticate,
  authorize(ROLES.OWNER),
  validate(createRecruiterSchema),
  createRecruiter,
);

/**
 * @openapi
 * /api/v1/company/recruiters:
 *   get:
 *     tags:
 *       - Company
 *     summary: List company recruiters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recruiters returned
 *       403:
 *         description: Owner role required
 */
router.get("/recruiters", authenticate, authorize(ROLES.OWNER), listRecruiters);

/**
 * @openapi
 * /api/v1/company/recruiters/{recruiterId}/status:
 *   patch:
 *     tags:
 *       - Company
 *     summary: Activate or deactivate a recruiter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recruiterId
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Recruiter status updated
 *       403:
 *         description: Owner role required
 *       404:
 *         description: Recruiter not found
 */
router.patch(
  "/recruiters/:recruiterId/status",
  authenticate,
  authorize(ROLES.OWNER),
  validate(updateRecruiterStatusSchema),
  updateRecruiterStatus,
);

/**
 * @openapi
 * /api/v1/company/logo:
 *   patch:
 *     tags:
 *       - Uploads
 *     summary: Upload or replace the company logo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP file up to 2 MB
 *     responses:
 *       200:
 *         description: Company logo uploaded
 *       400:
 *         description: Invalid or missing file
 *       403:
 *         description: Owner role required
 */
router.patch(
  "/logo",
  authenticate,
  authorize(ROLES.OWNER),
  uploadCompanyLogoFile,
  uploadCompanyLogo,
);

export default router;
