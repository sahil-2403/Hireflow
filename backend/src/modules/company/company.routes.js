import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";
import { uploadCompanyLogo as uploadCompanyLogoFile } from "../../shared/middleware/upload.js";

import { ROLES } from "../../config/constants.js";

import companyMemberRouter from "./companyMember.routes.js";

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
  deleteCompanyLogo,
} from "./company.controller.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - ownerId
 *         - logoUrl
 *         - industry
 *         - companySize
 *         - websiteUrl
 *         - description
 *         - headquarters
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Hireflow Technologies
 *         ownerId:
 *           $ref: "#/components/schemas/ObjectId"
 *         logoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://res.cloudinary.com/example/image/upload/company-logo.png
 *         industry:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Software Development
 *         companySize:
 *           type: string
 *           enum:
 *             - 1-10
 *             - 11-50
 *             - 51-200
 *             - 201-500
 *             - 501-1000
 *             - 1000+
 *           example: 11-50
 *         websiteUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.com
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           example: A product-focused software company building modern hiring tools.
 *         headquarters:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AiUsageState:
 *       type: object
 *       required:
 *         - featureKey
 *         - limit
 *         - used
 *         - remaining
 *         - dateKey
 *         - resetAt
 *       properties:
 *         featureKey:
 *           type: string
 *           example: job_post_suggestion
 *         limit:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         used:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         remaining:
 *           type: integer
 *           minimum: 0
 *           example: 4
 *         dateKey:
 *           type: string
 *           format: date
 *           example: "2026-08-01"
 *         resetAt:
 *           type: string
 *           format: date-time
 *
 *     CompanyAiJobPostAssistant:
 *       type: object
 *       required:
 *         - hasCompanyProfile
 *         - canGenerate
 *         - blockReason
 *         - usage
 *       properties:
 *         hasCompanyProfile:
 *           type: boolean
 *           example: true
 *         canGenerate:
 *           type: boolean
 *           example: true
 *         blockReason:
 *           type: string
 *           enum:
 *             - daily_limit
 *           nullable: true
 *           example: null
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     CompanyWithAiAssistant:
 *       allOf:
 *         - $ref: "#/components/schemas/Company"
 *         - type: object
 *           required:
 *             - aiJobPostAssistant
 *           properties:
 *             aiJobPostAssistant:
 *               $ref: "#/components/schemas/CompanyAiJobPostAssistant"
 *
 *     CreateCompanyInput:
 *       type: object
 *       required:
 *         - name
 *         - industry
 *         - companySize
 *         - headquarters
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Hireflow Technologies
 *         industry:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Software Development
 *         companySize:
 *           type: string
 *           enum:
 *             - 1-10
 *             - 11-50
 *             - 51-200
 *             - 201-500
 *             - 501-1000
 *             - 1000+
 *           example: 11-50
 *         websiteUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.com
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           example: A product-focused software company building modern hiring tools.
 *         headquarters:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         logo:
 *           type: string
 *           format: binary
 *           description: Optional JPEG, PNG, or WebP image up to 2 MB
 *
 *     UpdateCompanyInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Hireflow Technologies
 *         industry:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Software Development
 *         companySize:
 *           type: string
 *           enum:
 *             - 1-10
 *             - 11-50
 *             - 51-200
 *             - 201-500
 *             - 501-1000
 *             - 1000+
 *           example: 51-200
 *         websiteUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.com
 *         description:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *         headquarters:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *
 *     CreateRecruiterInput:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - jobTitle
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           pattern: "^[a-zA-Z0-9_]+$"
 *           example: recruiter_one
 *         email:
 *           type: string
 *           format: email
 *           example: recruiter@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           writeOnly: true
 *           example: Recruiter123
 *           description: Must contain uppercase, lowercase, and numeric characters
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Ananya
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Sharma
 *         jobTitle:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Technical Recruiter
 *
 *     CreatedRecruiter:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - username
 *         - email
 *         - profilePhotoUrl
 *         - firstName
 *         - lastName
 *         - jobTitle
 *         - isActive
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         userId:
 *           $ref: "#/components/schemas/ObjectId"
 *         username:
 *           type: string
 *           example: recruiter_one
 *         email:
 *           type: string
 *           format: email
 *           example: recruiter@example.com
 *         profilePhotoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         firstName:
 *           type: string
 *           example: Ananya
 *         lastName:
 *           type: string
 *           example: Sharma
 *         jobTitle:
 *           type: string
 *           example: Technical Recruiter
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     RecruiterUserSummary:
 *       type: object
 *       required:
 *         - _id
 *         - username
 *         - email
 *         - role
 *         - profilePhotoUrl
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         username:
 *           type: string
 *           example: recruiter_one
 *         email:
 *           type: string
 *           format: email
 *           example: recruiter@example.com
 *         role:
 *           type: string
 *           enum:
 *             - recruiter
 *           example: recruiter
 *         isActive:
 *           type: boolean
 *           example: true
 *         profilePhotoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *
 *     Recruiter:
 *       type: object
 *       required:
 *         - _id
 *         - userId
 *         - companyId
 *         - firstName
 *         - lastName
 *         - phone
 *         - jobTitle
 *         - isActive
 *         - createdBy
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         userId:
 *           $ref: "#/components/schemas/RecruiterUserSummary"
 *         companyId:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *           example: Ananya
 *         lastName:
 *           type: string
 *           example: Sharma
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+91 9876543210"
 *         jobTitle:
 *           type: string
 *           example: Technical Recruiter
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdBy:
 *           $ref: "#/components/schemas/ObjectId"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UpdateRecruiterStatusInput:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         isActive:
 *           type: boolean
 *           example: false
 */

router.use("/members", companyMemberRouter);

/**
 * @openapi
 * /api/v1/company:
 *   get:
 *     tags:
 *       - Company
 *     operationId: getMyCompany
 *     summary: Get the current company profile
 *     description: |
 *       Returns the company associated with the authenticated company
 *       administrator or active recruiter.
 *
 *       The response also includes the current user's AI Job Post
 *       Assistant eligibility and daily usage information.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Company profile and AI-assistant usage returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CompanyWithAiAssistant"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: createCompany
 *     summary: Create a company profile
 *     description: |
 *       Creates the authenticated company administrator's company
 *       profile.
 *
 *       A company administrator can own only one company profile.
 *       An optional company logo can be uploaded in the same multipart
 *       request.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: "#/components/schemas/CreateCompanyInput"
 *     responses:
 *       "201":
 *         description: Company profile created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Company"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Company profile created successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439012
 *                 name: Hireflow Technologies
 *                 ownerId: 507f1f77bcf86cd799439011
 *                 logoUrl: null
 *                 industry: Software Development
 *                 companySize: 11-50
 *                 websiteUrl: https://example.com
 *                 description: A product-focused software company.
 *                 headquarters: Pune, Maharashtra
 *                 createdAt: "2026-08-01T10:00:00.000Z"
 *                 updatedAt: "2026-08-01T10:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "409":
 *         $ref: "#/components/responses/Conflict"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/",
  authenticate,
  authorize(ROLES.OWNER),
  uploadCompanyLogoFile,
  validate(createCompanySchema),
  createCompany,
);

/**
 * @openapi
 * /api/v1/company:
 *   patch:
 *     tags:
 *       - Company
 *     operationId: updateCompany
 *     summary: Update the company profile
 *     description: |
 *       Updates one or more company-profile fields.
 *
 *       Only the company administrator can update company information.
 *       Company-logo changes use the separate `/api/v1/company/logo`
 *       endpoint.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateCompanyInput"
 *     responses:
 *       "200":
 *         description: Company profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Company"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: createRecruiter
 *     summary: Create a company recruiter
 *     description: |
 *       Creates a verified internal recruiter account and associates it
 *       with the authenticated company administrator's company.
 *
 *       Recruiter accounts cannot be created through public
 *       registration.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateRecruiterInput"
 *     responses:
 *       "201":
 *         description: Recruiter account created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CreatedRecruiter"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Recruiter created successfully
 *               data:
 *                 id: 507f1f77bcf86cd799439013
 *                 userId: 507f1f77bcf86cd799439014
 *                 username: recruiter_one
 *                 email: recruiter@example.com
 *                 profilePhotoUrl: null
 *                 firstName: Ananya
 *                 lastName: Sharma
 *                 jobTitle: Technical Recruiter
 *                 isActive: true
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "409":
 *         $ref: "#/components/responses/Conflict"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: listRecruiters
 *     summary: List company recruiters
 *     description: |
 *       Returns all recruiters associated with the authenticated company
 *       administrator's company, ordered from newest to oldest.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Company recruiters returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Recruiter"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/recruiters", authenticate, authorize(ROLES.OWNER), listRecruiters);

/**
 * @openapi
 * /api/v1/company/recruiters/{recruiterId}/status:
 *   patch:
 *     tags:
 *       - Company
 *     operationId: updateRecruiterStatus
 *     summary: Activate or deactivate a recruiter
 *     description: |
 *       Updates both the recruiter profile and the linked user account.
 *
 *       Deactivated recruiters can no longer authenticate or access
 *       company resources.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/RecruiterIdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateRecruiterStatusInput"
 *     responses:
 *       "200":
 *         description: Recruiter status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Recruiter"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *       - Company
 *       - Uploads
 *     operationId: uploadCompanyLogo
 *     summary: Upload or replace the company logo
 *     description: |
 *       Accepts one JPEG, PNG, or WebP image with a maximum size of 2 MB.
 *
 *       Replacing the logo removes the previous Cloudinary image after
 *       the new company data is saved successfully.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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
 *                 description: JPEG, PNG, or WebP image up to 2 MB
 *     responses:
 *       "200":
 *         description: Company logo uploaded or replaced
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Company"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.patch(
  "/logo",
  authenticate,
  authorize(ROLES.OWNER),
  uploadCompanyLogoFile,
  uploadCompanyLogo,
);

/**
 * @openapi
 * /api/v1/company/logo:
 *   delete:
 *     tags:
 *       - Company
 *       - Uploads
 *     operationId: deleteCompanyLogo
 *     summary: Remove the company logo
 *     description: |
 *       Clears the stored company-logo fields and removes the associated
 *       Cloudinary image when one exists.
 *
 *       The operation is safe when the company already has no logo.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: Company logo removed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/Company"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Company logo removed successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439012
 *                 name: Hireflow Technologies
 *                 ownerId: 507f1f77bcf86cd799439011
 *                 logoUrl: null
 *                 industry: Software Development
 *                 companySize: 11-50
 *                 websiteUrl: https://example.com
 *                 description: A product-focused software company.
 *                 headquarters: Pune, Maharashtra
 *                 createdAt: "2026-08-01T10:00:00.000Z"
 *                 updatedAt: "2026-08-01T10:30:00.000Z"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.delete("/logo", authenticate, authorize(ROLES.OWNER), deleteCompanyLogo);

export default router;
