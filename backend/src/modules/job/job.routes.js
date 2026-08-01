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
 * components:
 *   schemas:
 *     JobStatus:
 *       type: string
 *       enum:
 *         - open
 *         - closed
 *       example: open
 *
 *     EmploymentType:
 *       type: string
 *       enum:
 *         - full-time
 *         - part-time
 *         - contract
 *         - internship
 *       example: full-time
 *
 *     WorkplaceType:
 *       type: string
 *       enum:
 *         - onsite
 *         - remote
 *         - hybrid
 *       example: hybrid
 *
 *     ExperienceLevel:
 *       type: string
 *       enum:
 *         - entry
 *         - mid
 *         - senior
 *         - lead
 *       example: mid
 *
 *     JobCompanySummary:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - logoUrl
 *         - industry
 *         - headquarters
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         name:
 *           type: string
 *           example: Hireflow Technologies
 *         logoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://res.cloudinary.com/example/image/upload/company-logo.png
 *         industry:
 *           type: string
 *           example: Software Development
 *         headquarters:
 *           type: string
 *           example: Pune, Maharashtra
 *
 *     JobCompanyDetails:
 *       allOf:
 *         - $ref: "#/components/schemas/JobCompanySummary"
 *         - type: object
 *           required:
 *             - websiteUrl
 *             - description
 *           properties:
 *             websiteUrl:
 *               type: string
 *               format: uri
 *               nullable: true
 *               example: https://example.com
 *             description:
 *               type: string
 *               nullable: true
 *               example: A product-focused software company building modern hiring tools.
 *
 *     JobCreatorSummary:
 *       type: object
 *       required:
 *         - _id
 *         - username
 *         - email
 *         - role
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
 *             - owner
 *             - recruiter
 *           example: recruiter
 *
 *     JobCore:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - description
 *         - responsibilities
 *         - requirements
 *         - skills
 *         - location
 *         - employmentType
 *         - workplaceType
 *         - experienceLevel
 *         - salaryMin
 *         - salaryMax
 *         - salaryCurrency
 *         - isSalaryVisible
 *         - status
 *         - closedAt
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *           example: MERN Stack Developer
 *         description:
 *           type: string
 *           minLength: 20
 *           maxLength: 10000
 *           example: We are looking for a MERN Stack Developer to build and maintain modern web applications.
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - Build reusable React components
 *             - Develop secure REST APIs
 *             - Review and maintain production code
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - Strong JavaScript fundamentals
 *             - Experience with React and Node.js
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - JavaScript
 *             - React
 *             - Node.js
 *             - MongoDB
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         salaryMin:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           example: 500000
 *         salaryMax:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           example: 900000
 *         salaryCurrency:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: INR
 *         isSalaryVisible:
 *           type: boolean
 *           example: true
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *         closedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *
 *     StoredJob:
 *       allOf:
 *         - $ref: "#/components/schemas/JobCore"
 *         - type: object
 *           required:
 *             - companyId
 *             - createdBy
 *           properties:
 *             companyId:
 *               $ref: "#/components/schemas/ObjectId"
 *             createdBy:
 *               $ref: "#/components/schemas/ObjectId"
 *
 *     PublicJobListItem:
 *       allOf:
 *         - $ref: "#/components/schemas/JobCore"
 *         - type: object
 *           required:
 *             - companyId
 *           properties:
 *             companyId:
 *               $ref: "#/components/schemas/JobCompanySummary"
 *             score:
 *               type: number
 *               nullable: true
 *               description: MongoDB text-search relevance score, included only for text-search results
 *
 *     PublicJobDetails:
 *       allOf:
 *         - $ref: "#/components/schemas/JobCore"
 *         - type: object
 *           required:
 *             - companyId
 *           properties:
 *             companyId:
 *               $ref: "#/components/schemas/JobCompanyDetails"
 *
 *     ManagedJob:
 *       allOf:
 *         - $ref: "#/components/schemas/JobCore"
 *         - type: object
 *           required:
 *             - companyId
 *             - createdBy
 *           properties:
 *             companyId:
 *               $ref: "#/components/schemas/ObjectId"
 *             createdBy:
 *               $ref: "#/components/schemas/JobCreatorSummary"
 *             score:
 *               type: number
 *               nullable: true
 *               description: MongoDB text-search relevance score, included only for text-search results
 *
 *     CreateJobInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - employmentType
 *         - workplaceType
 *         - experienceLevel
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *           example: MERN Stack Developer
 *         description:
 *           type: string
 *           minLength: 20
 *           maxLength: 10000
 *           example: We are looking for a MERN Stack Developer to build and maintain modern web applications.
 *         responsibilities:
 *           type: array
 *           default: []
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - Build reusable React components
 *             - Develop secure REST APIs
 *         requirements:
 *           type: array
 *           default: []
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - Strong JavaScript fundamentals
 *             - Experience with React and Node.js
 *         skills:
 *           type: array
 *           default: []
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - JavaScript
 *             - React
 *             - Node.js
 *             - MongoDB
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         salaryMin:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           default: null
 *           example: 500000
 *         salaryMax:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           default: null
 *           example: 900000
 *         salaryCurrency:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           default: INR
 *           example: INR
 *         isSalaryVisible:
 *           type: boolean
 *           default: true
 *           example: true
 *
 *     UpdateJobInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *           example: Senior MERN Stack Developer
 *         description:
 *           type: string
 *           minLength: 20
 *           maxLength: 10000
 *         responsibilities:
 *           type: array
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *         requirements:
 *           type: array
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *         skills:
 *           type: array
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         salaryMin:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *         salaryMax:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *         salaryCurrency:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *           example: INR
 *         isSalaryVisible:
 *           type: boolean
 *
 *     UpdateJobStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *
 *     PaginatedPublicJobs:
 *       type: object
 *       required:
 *         - jobs
 *         - pagination
 *       properties:
 *         jobs:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/PublicJobListItem"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *
 *     PaginatedManagedJobs:
 *       type: object
 *       required:
 *         - jobs
 *         - pagination
 *       properties:
 *         jobs:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ManagedJob"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 */

/**
 * @openapi
 * /api/v1/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     operationId: listPublicJobs
 *     summary: List public open jobs
 *     description: |
 *       Returns paginated jobs whose status is `open`.
 *
 *       Text search checks the indexed job title, description, and skills.
 *       When `search` is supplied, results are ordered by text-search
 *       relevance and the `sortBy` and `order` options are ignored.
 *     parameters:
 *       - $ref: "#/components/parameters/PageQuery"
 *       - $ref: "#/components/parameters/LimitQuery"
 *       - $ref: "#/components/parameters/SearchQuery"
 *       - in: query
 *         name: employmentType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/EmploymentType"
 *         description: Filter by employment type
 *       - in: query
 *         name: workplaceType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         description: Filter by workplace arrangement
 *       - in: query
 *         name: experienceLevel
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         description: Filter by required experience level
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *           minLength: 1
 *         example: Pune
 *         description: Case-insensitive partial location filter
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - title
 *             - salaryMin
 *             - salaryMax
 *           default: createdAt
 *         description: Field used to sort results when text search is not active
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Paginated public jobs returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PaginatedPublicJobs"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Jobs fetched successfully
 *               data:
 *                 jobs:
 *                   - _id: 507f1f77bcf86cd799439020
 *                     companyId:
 *                       _id: 507f1f77bcf86cd799439012
 *                       name: Hireflow Technologies
 *                       logoUrl: null
 *                       industry: Software Development
 *                       headquarters: Pune, Maharashtra
 *                     title: MERN Stack Developer
 *                     description: We are looking for a MERN Stack Developer to build and maintain modern web applications.
 *                     responsibilities:
 *                       - Build reusable React components
 *                     requirements:
 *                       - Strong JavaScript fundamentals
 *                     skills:
 *                       - JavaScript
 *                       - React
 *                       - Node.js
 *                       - MongoDB
 *                     location: Pune, Maharashtra
 *                     employmentType: full-time
 *                     workplaceType: hybrid
 *                     experienceLevel: mid
 *                     salaryMin: 500000
 *                     salaryMax: 900000
 *                     salaryCurrency: INR
 *                     isSalaryVisible: true
 *                     status: open
 *                     closedAt: null
 *                     createdAt: "2026-08-01T10:00:00.000Z"
 *                     updatedAt: "2026-08-01T10:00:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 1
 *                   totalPages: 1
 *                   hasNextPage: false
 *                   hasPreviousPage: false
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/", listPublicJobs);

/**
 * @openapi
 * /api/v1/jobs/manage:
 *   get:
 *     tags:
 *       - Jobs
 *     operationId: listManagedJobs
 *     summary: List jobs managed by the current company
 *     description: |
 *       Returns jobs belonging to the authenticated company
 *       administrator's or active recruiter's company.
 *
 *       Unlike the public listing, this endpoint can return both open
 *       and closed jobs and includes the account that created each job.
 *
 *       When `search` is supplied, results are ordered by text-search
 *       relevance.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/PageQuery"
 *       - $ref: "#/components/parameters/LimitQuery"
 *       - $ref: "#/components/parameters/SearchQuery"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/JobStatus"
 *         description: Filter by current job status
 *       - in: query
 *         name: employmentType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/EmploymentType"
 *       - in: query
 *         name: workplaceType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/WorkplaceType"
 *       - in: query
 *         name: experienceLevel
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *           minLength: 1
 *         example: Pune
 *         description: Case-insensitive partial location filter
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - title
 *             - salaryMin
 *             - salaryMax
 *           default: createdAt
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Paginated managed jobs returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PaginatedManagedJobs"
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
router.get(
  "/manage",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedJobs,
);

/**
 * @openapi
 * /api/v1/jobs/manage/{jobId}:
 *   get:
 *     tags:
 *       - Jobs
 *     operationId: getManagedJobById
 *     summary: Get a managed job by ID
 *     description: |
 *       Returns an open or closed job belonging to the authenticated
 *       company member's company.
 *
 *       The response includes the owner or recruiter account that
 *       originally created the job.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     responses:
 *       "200":
 *         description: Managed job returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/ManagedJob"
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
 *     operationId: createJob
 *     summary: Create a company job
 *     description: |
 *       Creates a new open job for the authenticated company
 *       administrator's or active recruiter's company.
 *
 *       Duplicate values in responsibilities, requirements, and skills
 *       are removed during validation.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateJobInput"
 *     responses:
 *       "201":
 *         description: Job created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/StoredJob"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Job created successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439020
 *                 companyId: 507f1f77bcf86cd799439012
 *                 createdBy: 507f1f77bcf86cd799439011
 *                 title: MERN Stack Developer
 *                 description: We are looking for a MERN Stack Developer to build and maintain modern web applications.
 *                 responsibilities:
 *                   - Build reusable React components
 *                 requirements:
 *                   - Strong JavaScript fundamentals
 *                 skills:
 *                   - JavaScript
 *                   - React
 *                   - Node.js
 *                   - MongoDB
 *                 location: Pune, Maharashtra
 *                 employmentType: full-time
 *                 workplaceType: hybrid
 *                 experienceLevel: mid
 *                 salaryMin: 500000
 *                 salaryMax: 900000
 *                 salaryCurrency: INR
 *                 isSalaryVisible: true
 *                 status: open
 *                 closedAt: null
 *                 createdAt: "2026-08-01T10:00:00.000Z"
 *                 updatedAt: "2026-08-01T10:00:00.000Z"
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
 *     operationId: updateJob
 *     summary: Update a company job
 *     description: |
 *       Updates one or more supported fields on a job belonging to the
 *       authenticated company member's company.
 *
 *       The job status cannot be changed through this endpoint. Use
 *       `/api/v1/jobs/{jobId}/status` to open or close a job.
 *
 *       When both salary values are present, `salaryMax` must be greater
 *       than or equal to `salaryMin`.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateJobInput"
 *     responses:
 *       "200":
 *         description: Job updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/StoredJob"
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
 *     operationId: updateJobStatus
 *     summary: Open or close a company job
 *     description: |
 *       Changes the status of a job belonging to the authenticated
 *       company member's company.
 *
 *       Closing a job records the current time in `closedAt`. Reopening
 *       the job clears `closedAt`.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateJobStatusInput"
 *     responses:
 *       "200":
 *         description: Job status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/StoredJob"
 *             examples:
 *               closed:
 *                 summary: Job closed
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: Job closed successfully
 *                   data:
 *                     _id: 507f1f77bcf86cd799439020
 *                     companyId: 507f1f77bcf86cd799439012
 *                     createdBy: 507f1f77bcf86cd799439011
 *                     title: MERN Stack Developer
 *                     description: We are looking for a MERN Stack Developer to build and maintain modern web applications.
 *                     responsibilities: []
 *                     requirements: []
 *                     skills:
 *                       - JavaScript
 *                       - React
 *                     location: Pune, Maharashtra
 *                     employmentType: full-time
 *                     workplaceType: hybrid
 *                     experienceLevel: mid
 *                     salaryMin: 500000
 *                     salaryMax: 900000
 *                     salaryCurrency: INR
 *                     isSalaryVisible: true
 *                     status: closed
 *                     closedAt: "2026-08-01T12:00:00.000Z"
 *                     createdAt: "2026-08-01T10:00:00.000Z"
 *                     updatedAt: "2026-08-01T12:00:00.000Z"
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
 *     operationId: getPublicJobById
 *     summary: Get public details for an open job
 *     description: |
 *       Returns a publicly accessible open job and an expanded summary
 *       of the hiring company.
 *
 *       Closed jobs are not available through this endpoint.
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     responses:
 *       "200":
 *         description: Public open job returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PublicJobDetails"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:jobId", getPublicJobById);

export default router;
