import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";

import { ROLES } from "../../config/constants.js";

import {
  getRecommendedJobMatch,
  listRecommendedJobs,
} from "./recommendation.controller.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     RecommendationMatchBasis:
 *       type: string
 *       enum:
 *         - profile
 *         - profile_and_resume
 *       example: profile_and_resume
 *
 *     RecommendationMatchSummary:
 *       type: object
 *       required:
 *         - matchScore
 *         - matchLabel
 *         - matchBasis
 *         - profileScore
 *         - resumeBoost
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - resumeEvidence
 *         - warnings
 *         - calculatedAt
 *       properties:
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 84
 *         matchLabel:
 *           type: string
 *           example: Strong match
 *         matchBasis:
 *           $ref: "#/components/schemas/RecommendationMatchBasis"
 *         profileScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 76
 *         resumeBoost:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 8
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 88
 *         confidenceLevel:
 *           type: string
 *           example: high
 *         matchedSkills:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - javascript
 *             - react
 *             - node.js
 *         missingSkills:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - docker
 *         resumeEvidence:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Resume analysis supports three matched skills.
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         calculatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *
 *     RecommendedJob:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - description
 *         - location
 *         - employmentType
 *         - workplaceType
 *         - experienceLevel
 *         - salaryMin
 *         - salaryMax
 *         - salaryCurrency
 *         - isSalaryVisible
 *         - skills
 *         - createdAt
 *         - companyId
 *         - match
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         description:
 *           type: string
 *           example: Build and maintain modern full-stack web applications.
 *         location:
 *           type: string
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
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - JavaScript
 *             - React
 *             - Node.js
 *             - MongoDB
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         companyId:
 *           $ref: "#/components/schemas/JobCompanySummary"
 *         match:
 *           $ref: "#/components/schemas/RecommendationMatchSummary"
 *
 *     RecommendationRanking:
 *       type: object
 *       required:
 *         - strategy
 *         - candidatePoolSize
 *         - candidatePoolLimit
 *         - exactScoredJobs
 *       properties:
 *         strategy:
 *           type: string
 *           enum:
 *             - two_stage_exact_rerank
 *             - database_paginated
 *           example: two_stage_exact_rerank
 *         candidatePoolSize:
 *           type: integer
 *           minimum: 0
 *           example: 80
 *         candidatePoolLimit:
 *           type: integer
 *           minimum: 0
 *           example: 200
 *         exactScoredJobs:
 *           type: integer
 *           minimum: 0
 *           example: 80
 *
 *     RecommendationAiEnhancement:
 *       type: object
 *       required:
 *         - enabled
 *         - source
 *         - matchBasis
 *         - resumeAnalysisId
 *       properties:
 *         enabled:
 *           type: boolean
 *           example: true
 *         source:
 *           type: string
 *           enum:
 *             - stored_resume_insights
 *             - candidate_profile
 *           example: stored_resume_insights
 *         matchBasis:
 *           $ref: "#/components/schemas/RecommendationMatchBasis"
 *         resumeAnalysisId:
 *           $ref: "#/components/schemas/ObjectId"
 *           nullable: true
 *
 *     RecommendedJobsResult:
 *       type: object
 *       required:
 *         - jobs
 *         - pagination
 *         - ranking
 *         - aiEnhancement
 *       properties:
 *         jobs:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/RecommendedJob"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *         ranking:
 *           $ref: "#/components/schemas/RecommendationRanking"
 *         aiEnhancement:
 *           $ref: "#/components/schemas/RecommendationAiEnhancement"
 *
 *     RecommendationMatchBreakdown:
 *       type: object
 *       required:
 *         - skills
 *         - title
 *         - experience
 *         - location
 *         - workplaceType
 *         - employmentType
 *       properties:
 *         skills:
 *           type: object
 *           additionalProperties: true
 *           description: Skill-overlap score and matched-skill counts
 *         title:
 *           type: object
 *           additionalProperties: true
 *           description: Job-title similarity score and source
 *         experience:
 *           type: object
 *           additionalProperties: true
 *           description: Candidate and job experience-level comparison
 *         location:
 *           type: object
 *           additionalProperties: true
 *           description: Location-preference comparison
 *         workplaceType:
 *           type: object
 *           additionalProperties: true
 *           description: Workplace-type preference comparison
 *         employmentType:
 *           type: object
 *           additionalProperties: true
 *           description: Employment-type preference comparison
 *
 *     DetailedRecommendationMatch:
 *       type: object
 *       required:
 *         - matchScore
 *         - matchLabel
 *         - confidenceScore
 *         - confidenceLevel
 *         - breakdown
 *         - matchedSkills
 *         - missingSkills
 *         - extraCandidateSkills
 *         - reasons
 *         - warnings
 *         - jobSignature
 *         - candidateSignature
 *         - engineVersion
 *         - calculatedAt
 *         - matchBasis
 *         - profileScore
 *         - resumeBoost
 *         - resumeEvidence
 *         - resumeAnalysisId
 *       properties:
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 84
 *         matchLabel:
 *           type: string
 *           example: Strong match
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 88
 *         confidenceLevel:
 *           type: string
 *           example: high
 *         breakdown:
 *           $ref: "#/components/schemas/RecommendationMatchBreakdown"
 *         matchedSkills:
 *           type: array
 *           items:
 *             type: string
 *         missingSkills:
 *           type: array
 *           items:
 *             type: string
 *         extraCandidateSkills:
 *           type: array
 *           items:
 *             type: string
 *         reasons:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         jobSignature:
 *           type: string
 *           description: Signature representing the job fields used for matching
 *         candidateSignature:
 *           type: string
 *           description: Signature representing the candidate fields used for matching
 *         engineVersion:
 *           type: string
 *           example: v1
 *         calculatedAt:
 *           type: string
 *           format: date-time
 *         matchBasis:
 *           $ref: "#/components/schemas/RecommendationMatchBasis"
 *         profileScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 76
 *         resumeBoost:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 8
 *         resumeEvidence:
 *           type: array
 *           items:
 *             type: string
 *         resumeAnalysisId:
 *           $ref: "#/components/schemas/ObjectId"
 *           nullable: true
 *
 *     RecommendationJobIdentity:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *
 *     JobResumeFit:
 *       type: object
 *       required:
 *         - id
 *         - jobId
 *         - resumeAnalysisId
 *         - enhancedMatchScore
 *         - matchLabel
 *         - matchBasis
 *         - profileScore
 *         - resumeBoost
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - resumeEvidence
 *         - summary
 *         - matchedRequirements
 *         - missingRequirements
 *         - resumeImprovements
 *         - profileImprovements
 *         - beforeApplyingChecklist
 *         - provider
 *         - model
 *         - generatedAt
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/ObjectId"
 *         resumeAnalysisId:
 *           $ref: "#/components/schemas/ObjectId"
 *         enhancedMatchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 84
 *         matchLabel:
 *           type: string
 *           example: Strong match
 *         matchBasis:
 *           $ref: "#/components/schemas/RecommendationMatchBasis"
 *         profileScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 76
 *         resumeBoost:
 *           type: number
 *           minimum: 0
 *           example: 8
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 88
 *         confidenceLevel:
 *           type: string
 *           example: high
 *         matchedSkills:
 *           type: array
 *           items:
 *             type: string
 *         missingSkills:
 *           type: array
 *           items:
 *             type: string
 *         resumeEvidence:
 *           type: array
 *           items:
 *             type: string
 *         summary:
 *           type: string
 *           example: Your resume demonstrates strong alignment with this role.
 *         matchedRequirements:
 *           type: array
 *           items:
 *             type: string
 *         missingRequirements:
 *           type: array
 *           items:
 *             type: string
 *         resumeImprovements:
 *           type: array
 *           items:
 *             type: string
 *         profileImprovements:
 *           type: array
 *           items:
 *             type: string
 *         beforeApplyingChecklist:
 *           type: array
 *           items:
 *             type: string
 *         provider:
 *           type: string
 *           nullable: true
 *           example: gemini
 *         model:
 *           type: string
 *           nullable: true
 *         generatedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AiResumeFitEligibility:
 *       type: object
 *       required:
 *         - hasCandidateProfile
 *         - hasResume
 *         - hasResumeInsights
 *         - canGenerate
 *         - blockReason
 *         - fit
 *         - usage
 *       properties:
 *         hasCandidateProfile:
 *           type: boolean
 *           example: true
 *         hasResume:
 *           type: boolean
 *           example: true
 *         hasResumeInsights:
 *           type: boolean
 *           example: true
 *         canGenerate:
 *           type: boolean
 *           example: true
 *         blockReason:
 *           type: string
 *           enum:
 *             - missing_resume
 *             - missing_resume_insights
 *             - daily_limit
 *           nullable: true
 *           example: null
 *         fit:
 *           $ref: "#/components/schemas/JobResumeFit"
 *           nullable: true
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     RecommendedJobMatchResult:
 *       type: object
 *       required:
 *         - job
 *         - match
 *         - aiResumeFit
 *       properties:
 *         job:
 *           $ref: "#/components/schemas/RecommendationJobIdentity"
 *         match:
 *           $ref: "#/components/schemas/DetailedRecommendationMatch"
 *         aiResumeFit:
 *           $ref: "#/components/schemas/AiResumeFitEligibility"
 */

/**
 * @openapi
 * /api/v1/recommendations/jobs:
 *   get:
 *     tags:
 *       - Recommendations
 *     operationId: listRecommendedJobs
 *     summary: List personalized job recommendations
 *     description: |
 *       Returns open jobs ranked and scored against the authenticated
 *       candidate's profile and job preferences.
 *
 *       When fresh stored resume insights are available, matching also
 *       includes resume-derived skills, technologies, projects, and
 *       target roles.
 *
 *       The default sort is `matchScore`.
 *
 *       Match-score sorting uses a two-stage process:
 *
 *       1. MongoDB retrieves a bounded pool of at most 200 relevant jobs.
 *       2. The exact deterministic matching engine scores and reranks
 *          that pool.
 *
 *       Other sorts use normal database pagination and calculate match
 *       information only for the jobs displayed on the current page.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/PageQuery"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         example: 10
 *         description: Number of recommendations per page
 *       - $ref: "#/components/parameters/SearchQuery"
 *       - in: query
 *         name: employmentType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/EmploymentType"
 *         description: Filter jobs by employment type
 *       - in: query
 *         name: workplaceType
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         description: Filter jobs by workplace arrangement
 *       - in: query
 *         name: experienceLevel
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         description: Filter jobs by required experience level
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
 *             - matchScore
 *             - createdAt
 *             - title
 *             - salaryMin
 *             - salaryMax
 *           default: matchScore
 *         description: Field used to order recommendations
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Personalized job recommendations returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/RecommendedJobsResult"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Recommended jobs fetched successfully
 *               data:
 *                 jobs:
 *                   - _id: 507f1f77bcf86cd799439020
 *                     title: MERN Stack Developer
 *                     description: Build and maintain modern full-stack web applications.
 *                     location: Pune, Maharashtra
 *                     employmentType: full-time
 *                     workplaceType: hybrid
 *                     experienceLevel: entry
 *                     salaryMin: 500000
 *                     salaryMax: 900000
 *                     salaryCurrency: INR
 *                     isSalaryVisible: true
 *                     skills:
 *                       - JavaScript
 *                       - React
 *                       - Node.js
 *                       - MongoDB
 *                     createdAt: "2026-08-01T10:00:00.000Z"
 *                     companyId:
 *                       _id: 507f1f77bcf86cd799439012
 *                       name: Hireflow Technologies
 *                       logoUrl: null
 *                       industry: Software Development
 *                       headquarters: Pune, Maharashtra
 *                     match:
 *                       matchScore: 84
 *                       matchLabel: Strong match
 *                       matchBasis: profile_and_resume
 *                       profileScore: 76
 *                       resumeBoost: 8
 *                       confidenceScore: 88
 *                       confidenceLevel: high
 *                       matchedSkills:
 *                         - JavaScript
 *                         - React
 *                         - Node.js
 *                       missingSkills:
 *                         - Docker
 *                       resumeEvidence:
 *                         - Resume analysis supports three matched skills.
 *                       warnings: []
 *                       calculatedAt: "2026-08-01T10:05:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 1
 *                   totalPages: 1
 *                   hasNextPage: false
 *                   hasPreviousPage: false
 *                 ranking:
 *                   strategy: two_stage_exact_rerank
 *                   candidatePoolSize: 1
 *                   candidatePoolLimit: 200
 *                   exactScoredJobs: 1
 *                 aiEnhancement:
 *                   enabled: true
 *                   source: stored_resume_insights
 *                   matchBasis: profile_and_resume
 *                   resumeAnalysisId: 507f1f77bcf86cd799439050
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
  "/jobs",
  authenticate,
  authorize(ROLES.CANDIDATE),
  listRecommendedJobs,
);

/**
 * @openapi
 * /api/v1/recommendations/jobs/{jobId}/match:
 *   get:
 *     tags:
 *       - Recommendations
 *     operationId: getRecommendedJobMatch
 *     summary: Get the candidate's detailed match for one job
 *     description: |
 *       Calculates a detailed deterministic match between the
 *       authenticated candidate and an open job.
 *
 *       The result includes category-level scoring, matched and missing
 *       skills, confidence information, explanations, warnings, and
 *       resume-derived evidence when current resume insights exist.
 *
 *       The `aiResumeFit` object explains whether a deeper AI Resume Fit
 *       can be generated. A valid cached fit is returned even when the
 *       candidate has exhausted the current daily usage limit.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     responses:
 *       "200":
 *         description: Detailed candidate-to-job match returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/RecommendedJobMatchResult"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Job match fetched successfully
 *               data:
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 match:
 *                   matchScore: 84
 *                   matchLabel: Strong match
 *                   confidenceScore: 88
 *                   confidenceLevel: high
 *                   breakdown:
 *                     skills:
 *                       score: 32
 *                       maxScore: 40
 *                       requiredSkillCount: 5
 *                       matchedSkillCount: 4
 *                     title:
 *                       score: 15
 *                       maxScore: 20
 *                       similarityPercentage: 75
 *                       source: candidate-preferences
 *                     experience:
 *                       score: 15
 *                       maxScore: 15
 *                       jobExperienceLevel: entry
 *                       candidateExperienceLevel: entry
 *                     location:
 *                       score: 10
 *                       maxScore: 10
 *                       source: candidate-preferences
 *                       matchedLocation: Pune
 *                     workplaceType:
 *                       score: 8
 *                       maxScore: 8
 *                       matched: true
 *                     employmentType:
 *                       score: 6
 *                       maxScore: 7
 *                       matched: true
 *                   matchedSkills:
 *                     - JavaScript
 *                     - React
 *                     - Node.js
 *                   missingSkills:
 *                     - Docker
 *                   extraCandidateSkills:
 *                     - Express
 *                     - Mongoose
 *                   reasons:
 *                     - The candidate meets or exceeds the job's experience level.
 *                   warnings: []
 *                   jobSignature: job-signature
 *                   candidateSignature: candidate-signature
 *                   engineVersion: v1
 *                   calculatedAt: "2026-08-01T10:05:00.000Z"
 *                   matchBasis: profile_and_resume
 *                   profileScore: 76
 *                   resumeBoost: 8
 *                   resumeEvidence:
 *                     - Resume analysis supports three matched skills.
 *                   resumeAnalysisId: 507f1f77bcf86cd799439050
 *                 aiResumeFit:
 *                   hasCandidateProfile: true
 *                   hasResume: true
 *                   hasResumeInsights: true
 *                   canGenerate: true
 *                   blockReason: null
 *                   fit: null
 *                   usage:
 *                     featureKey: job_resume_fit
 *                     limit: 5
 *                     used: 1
 *                     remaining: 4
 *                     dateKey: "2026-08-01"
 *                     resetAt: "2026-08-02T00:00:00.000Z"
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
  "/jobs/:jobId/match",
  authenticate,
  authorize(ROLES.CANDIDATE),
  getRecommendedJobMatch,
);

export default router;
