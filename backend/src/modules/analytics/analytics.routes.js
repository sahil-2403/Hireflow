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
 * components:
 *   schemas:
 *     AnalyticsStatusCount:
 *       type: object
 *       required:
 *         - status
 *         - count
 *       properties:
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         count:
 *           type: integer
 *           minimum: 0
 *           example: 4
 *
 *     AnalyticsCompanySummary:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - logoUrl
 *         - industry
 *         - headquarters
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         name:
 *           type: string
 *           example: Hireflow Technologies
 *         logoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: null
 *         industry:
 *           type: string
 *           example: Software Development
 *         headquarters:
 *           type: string
 *           example: Pune, Maharashtra
 *
 *     CompanyJobAnalytics:
 *       type: object
 *       required:
 *         - totalJobs
 *         - openJobs
 *         - closedJobs
 *       properties:
 *         totalJobs:
 *           type: integer
 *           minimum: 0
 *           example: 12
 *         openJobs:
 *           type: integer
 *           minimum: 0
 *           example: 8
 *         closedJobs:
 *           type: integer
 *           minimum: 0
 *           example: 4
 *
 *     CompanyApplicationAnalytics:
 *       type: object
 *       required:
 *         - totalApplications
 *         - uniqueCandidates
 *         - hiredCandidates
 *         - rejectedApplications
 *       properties:
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           example: 80
 *         uniqueCandidates:
 *           type: integer
 *           minimum: 0
 *           example: 65
 *         hiredCandidates:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         rejectedApplications:
 *           type: integer
 *           minimum: 0
 *           example: 20
 *
 *     CompanyRecruiterAnalytics:
 *       type: object
 *       required:
 *         - activeRecruiters
 *       properties:
 *         activeRecruiters:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *
 *     AnalyticsRecentApplicationJob:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *
 *     AnalyticsRecentApplicationCandidate:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *           example: Sahil
 *         lastName:
 *           type: string
 *           example: Pawar
 *         headline:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer
 *
 *     CompanyRecentApplication:
 *       type: object
 *       required:
 *         - _id
 *         - status
 *         - appliedAt
 *         - jobId
 *         - candidateId
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         jobId:
 *           $ref: "#/components/schemas/AnalyticsRecentApplicationJob"
 *         candidateId:
 *           $ref: "#/components/schemas/AnalyticsRecentApplicationCandidate"
 *
 *     CompanyAnalyticsOverview:
 *       type: object
 *       required:
 *         - company
 *         - jobs
 *         - applications
 *         - recruiters
 *         - recentApplications
 *       properties:
 *         company:
 *           $ref: "#/components/schemas/AnalyticsCompanySummary"
 *         jobs:
 *           $ref: "#/components/schemas/CompanyJobAnalytics"
 *         applications:
 *           $ref: "#/components/schemas/CompanyApplicationAnalytics"
 *         recruiters:
 *           $ref: "#/components/schemas/CompanyRecruiterAnalytics"
 *         recentApplications:
 *           type: array
 *           maxItems: 5
 *           items:
 *             $ref: "#/components/schemas/CompanyRecentApplication"
 *
 *     HiringFunnelAnalytics:
 *       type: object
 *       required:
 *         - totalApplications
 *         - funnel
 *       properties:
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           example: 80
 *         funnel:
 *           type: array
 *           description: Contains an entry for every supported application status
 *           items:
 *             $ref: "#/components/schemas/AnalyticsStatusCount"
 *           example:
 *             - status: applied
 *               count: 30
 *             - status: screening
 *               count: 15
 *             - status: interview
 *               count: 8
 *             - status: offer
 *               count: 2
 *             - status: hired
 *               count: 5
 *             - status: rejected
 *               count: 20
 *
 *     TopJobAnalytics:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - status
 *         - location
 *         - createdAt
 *         - applicationCount
 *         - hiredCount
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         applicationCount:
 *           type: integer
 *           minimum: 0
 *           example: 25
 *         hiredCount:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *
 *     TopApplicantJob:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - status
 *         - location
 *         - createdAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *
 *     TopApplicantCandidate:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *           example: Sahil
 *         lastName:
 *           type: string
 *           example: Pawar
 *         headline:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *
 *     TopApplicantUser:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         username:
 *           type: string
 *           example: sahil_24
 *         email:
 *           type: string
 *           format: email
 *           example: candidate@example.com
 *         profilePhotoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: null
 *
 *     TopApplicantMatch:
 *       type: object
 *       nullable: true
 *       required:
 *         - matchScore
 *         - matchLabel
 *         - confidenceLevel
 *       properties:
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 88
 *         matchLabel:
 *           type: string
 *           example: Excellent match
 *         confidenceLevel:
 *           type: string
 *           example: high
 *
 *     TopApplicantDetails:
 *       type: object
 *       required:
 *         - applicationId
 *         - status
 *         - appliedAt
 *         - candidate
 *         - candidateUser
 *         - match
 *       properties:
 *         applicationId:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T11:00:00.000Z"
 *         candidate:
 *           $ref: "#/components/schemas/TopApplicantCandidate"
 *         candidateUser:
 *           $ref: "#/components/schemas/TopApplicantUser"
 *         match:
 *           $ref: "#/components/schemas/TopApplicantMatch"
 *
 *     TopApplicantByJob:
 *       type: object
 *       required:
 *         - job
 *         - topApplicant
 *       properties:
 *         job:
 *           $ref: "#/components/schemas/TopApplicantJob"
 *         topApplicant:
 *           $ref: "#/components/schemas/TopApplicantDetails"
 *
 *     CandidateAnalyticsProfile:
 *       type: object
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - headline
 *         - resumeUrl
 *         - profileCompletionPercentage
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *           example: Sahil
 *         lastName:
 *           type: string
 *           example: Pawar
 *         headline:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://res.cloudinary.com/example/raw/upload/resume.pdf
 *         profileCompletionPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 80
 *
 *     CandidateRecentApplicationJob:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *
 *     CandidateRecentApplicationCompany:
 *       type: object
 *       nullable: true
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
 *           example: null
 *         industry:
 *           type: string
 *           example: Software Development
 *
 *     CandidateRecentApplication:
 *       type: object
 *       required:
 *         - _id
 *         - status
 *         - appliedAt
 *         - jobId
 *         - companyId
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         appliedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         jobId:
 *           $ref: "#/components/schemas/CandidateRecentApplicationJob"
 *         companyId:
 *           $ref: "#/components/schemas/CandidateRecentApplicationCompany"
 *
 *     CandidateAnalyticsOverview:
 *       type: object
 *       required:
 *         - profile
 *         - totalApplications
 *         - applicationsByStatus
 *         - recentApplications
 *       properties:
 *         profile:
 *           $ref: "#/components/schemas/CandidateAnalyticsProfile"
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           example: 12
 *         applicationsByStatus:
 *           type: array
 *           description: Contains an entry for every supported application status
 *           items:
 *             $ref: "#/components/schemas/AnalyticsStatusCount"
 *         recentApplications:
 *           type: array
 *           maxItems: 5
 *           items:
 *             $ref: "#/components/schemas/CandidateRecentApplication"
 */

/**
 * @openapi
 * /api/v1/analytics/company/overview:
 *   get:
 *     tags:
 *       - Analytics
 *     operationId: getCompanyOverview
 *     summary: Get the company dashboard overview
 *     description: |
 *       Returns dashboard metrics for the authenticated company
 *       administrator or active recruiter.
 *
 *       The response contains:
 *
 *       - Company summary
 *       - Open, closed, and total job counts
 *       - Application and unique-candidate totals
 *       - Hired and rejected counts
 *       - Active recruiter count
 *       - Five most recent applications
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Company dashboard analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CompanyAnalyticsOverview"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Company analytics fetched successfully
 *               data:
 *                 company:
 *                   id: 507f1f77bcf86cd799439012
 *                   name: Hireflow Technologies
 *                   logoUrl: null
 *                   industry: Software Development
 *                   headquarters: Pune, Maharashtra
 *                 jobs:
 *                   totalJobs: 12
 *                   openJobs: 8
 *                   closedJobs: 4
 *                 applications:
 *                   totalApplications: 80
 *                   uniqueCandidates: 65
 *                   hiredCandidates: 5
 *                   rejectedApplications: 20
 *                 recruiters:
 *                   activeRecruiters: 3
 *                 recentApplications:
 *                   - _id: 507f1f77bcf86cd799439040
 *                     status: applied
 *                     appliedAt: "2026-08-01T10:00:00.000Z"
 *                     jobId:
 *                       _id: 507f1f77bcf86cd799439020
 *                       title: MERN Stack Developer
 *                     candidateId:
 *                       _id: 507f1f77bcf86cd799439030
 *                       firstName: Sahil
 *                       lastName: Pawar
 *                       headline: MERN Stack Developer
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
 *     operationId: getHiringFunnel
 *     summary: Get application counts by hiring stage
 *     description: |
 *       Returns the number of company applications in each hiring
 *       workflow status.
 *
 *       Every supported status is included, including statuses whose
 *       current count is zero.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Hiring-funnel analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/HiringFunnelAnalytics"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Hiring funnel fetched successfully
 *               data:
 *                 totalApplications: 80
 *                 funnel:
 *                   - status: applied
 *                     count: 30
 *                   - status: screening
 *                     count: 15
 *                   - status: interview
 *                     count: 8
 *                   - status: offer
 *                     count: 2
 *                   - status: hired
 *                     count: 5
 *                   - status: rejected
 *                     count: 20
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
 *     operationId: getTopJobs
 *     summary: Get jobs ranked by application count
 *     description: |
 *       Returns company jobs ordered by total application count and then
 *       by creation date.
 *
 *       The result includes the number of applications and hires for
 *       each job.
 *
 *       The default limit is `5`. Values above `20` are capped at `20`.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         example: 5
 *         description: Maximum number of ranked jobs to return
 *     responses:
 *       "200":
 *         description: Top company jobs returned
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
 *                         $ref: "#/components/schemas/TopJobAnalytics"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Top jobs fetched successfully
 *               data:
 *                 - _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                   status: open
 *                   location: Pune, Maharashtra
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   applicationCount: 25
 *                   hiredCount: 2
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
  "/company/top-jobs",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getTopJobs,
);

/**
 * @openapi
 * /api/v1/analytics/company/top-applicants:
 *   get:
 *     tags:
 *       - Analytics
 *     operationId: getTopApplicantsByLatestJobs
 *     summary: Get the top applicant for each latest company job
 *     description: |
 *       Selects the company's latest jobs that have at least one
 *       application, then returns the strongest applicant for each job.
 *
 *       Applicants are ranked using the stored deterministic match
 *       score. When scores are equal, the most recently submitted
 *       application is selected.
 *
 *       The default limit is `5`. Values above `10` are capped at `10`.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         example: 5
 *         description: Maximum number of latest jobs to evaluate
 *     responses:
 *       "200":
 *         description: Top applicants for the latest company jobs returned
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
 *                         $ref: "#/components/schemas/TopApplicantByJob"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Top applicants by latest jobs fetched successfully
 *               data:
 *                 - job:
 *                     _id: 507f1f77bcf86cd799439020
 *                     title: MERN Stack Developer
 *                     status: open
 *                     location: Pune, Maharashtra
 *                     createdAt: "2026-08-01T10:00:00.000Z"
 *                   topApplicant:
 *                     applicationId: 507f1f77bcf86cd799439040
 *                     status: screening
 *                     appliedAt: "2026-08-01T11:00:00.000Z"
 *                     candidate:
 *                       _id: 507f1f77bcf86cd799439030
 *                       firstName: Sahil
 *                       lastName: Pawar
 *                       headline: MERN Stack Developer
 *                       location: Pune, Maharashtra
 *                     candidateUser:
 *                       _id: 507f1f77bcf86cd799439011
 *                       username: sahil_24
 *                       email: candidate@example.com
 *                       profilePhotoUrl: null
 *                     match:
 *                       matchScore: 88
 *                       matchLabel: Excellent match
 *                       confidenceLevel: high
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
 *     operationId: getCandidateOverview
 *     summary: Get the candidate dashboard overview
 *     description: |
 *       Returns dashboard information for the authenticated candidate.
 *
 *       The response includes:
 *
 *       - Basic profile information
 *       - Profile-completion percentage
 *       - Total application count
 *       - Counts for every application status
 *       - Five most recent applications
 *
 *       Profile completion is calculated from ten profile values:
 *       first name, last name, headline, summary, location, resume,
 *       LinkedIn URL, GitHub URL, portfolio URL, and at least one skill.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Candidate dashboard analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateAnalyticsOverview"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Candidate analytics fetched successfully
 *               data:
 *                 profile:
 *                   id: 507f1f77bcf86cd799439030
 *                   firstName: Sahil
 *                   lastName: Pawar
 *                   headline: MERN Stack Developer
 *                   resumeUrl: https://res.cloudinary.com/example/raw/upload/resume.pdf
 *                   profileCompletionPercentage: 80
 *                 totalApplications: 12
 *                 applicationsByStatus:
 *                   - status: applied
 *                     count: 5
 *                   - status: screening
 *                     count: 3
 *                   - status: interview
 *                     count: 2
 *                   - status: offer
 *                     count: 1
 *                   - status: hired
 *                     count: 1
 *                   - status: rejected
 *                     count: 0
 *                 recentApplications:
 *                   - _id: 507f1f77bcf86cd799439040
 *                     status: applied
 *                     appliedAt: "2026-08-01T10:00:00.000Z"
 *                     jobId:
 *                       _id: 507f1f77bcf86cd799439020
 *                       title: MERN Stack Developer
 *                       location: Pune, Maharashtra
 *                       status: open
 *                       workplaceType: hybrid
 *                       employmentType: full-time
 *                     companyId:
 *                       _id: 507f1f77bcf86cd799439012
 *                       name: Hireflow Technologies
 *                       logoUrl: null
 *                       industry: Software Development
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
  "/candidate/overview",
  authenticate,
  authorize(ROLES.CANDIDATE),
  getCandidateOverview,
);

export default router;
