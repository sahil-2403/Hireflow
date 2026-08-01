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
 * components:
 *   schemas:
 *     ApplicationStatus:
 *       type: string
 *       enum:
 *         - applied
 *         - screening
 *         - interview
 *         - offer
 *         - hired
 *         - rejected
 *       example: applied
 *
 *     ApplicationStatusCounts:
 *       type: object
 *       required:
 *         - applied
 *         - screening
 *         - interview
 *         - offer
 *         - hired
 *         - rejected
 *       properties:
 *         applied:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         screening:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *         interview:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *         offer:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         hired:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         rejected:
 *           type: integer
 *           minimum: 0
 *           example: 4
 *
 *     ApplicationMatchCounts:
 *       type: object
 *       required:
 *         - excellent
 *         - strong
 *         - good
 *         - partial
 *         - low
 *       properties:
 *         excellent:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         strong:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *         good:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *         partial:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         low:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *
 *     ApplicationUserSummary:
 *       type: object
 *       required:
 *         - _id
 *         - username
 *         - email
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
 *             - candidate
 *             - owner
 *             - recruiter
 *           example: recruiter
 *         profilePhotoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: null
 *
 *     ApplicationStatusHistoryItem:
 *       type: object
 *       required:
 *         - status
 *         - changedAt
 *       properties:
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         changedBy:
 *           oneOf:
 *             - $ref: "#/components/schemas/ObjectId"
 *             - $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         changedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *
 *     ApplicationMatch:
 *       type: object
 *       nullable: true
 *       required:
 *         - matchScore
 *         - matchLabel
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - extraCandidateSkills
 *         - warnings
 *         - calculatedAt
 *       properties:
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 78
 *         matchLabel:
 *           type: string
 *           example: Strong match
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 85
 *         confidenceLevel:
 *           type: string
 *           example: high
 *         breakdown:
 *           type: object
 *           additionalProperties: true
 *           description: Deterministic matching-score breakdown
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
 *         extraCandidateSkills:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - express
 *             - mongoose
 *         reasons:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         calculatedAt:
 *           type: string
 *           format: date-time
 *
 *     ApplicationListMatch:
 *       type: object
 *       nullable: true
 *       required:
 *         - matchScore
 *         - matchLabel
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - extraCandidateSkills
 *         - warnings
 *         - calculatedAt
 *       properties:
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 78
 *         matchLabel:
 *           type: string
 *           example: Strong match
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 85
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
 *         extraCandidateSkills:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         calculatedAt:
 *           type: string
 *           format: date-time
 *
 *     SubmittedApplication:
 *       type: object
 *       required:
 *         - _id
 *         - jobId
 *         - candidateId
 *         - candidateUserId
 *         - companyId
 *         - coverLetter
 *         - resumeUrl
 *         - status
 *         - statusHistory
 *         - reviewedBy
 *         - appliedAt
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateUserId:
 *           $ref: "#/components/schemas/ObjectId"
 *         companyId:
 *           $ref: "#/components/schemas/ObjectId"
 *         coverLetter:
 *           type: string
 *           maxLength: 5000
 *           nullable: true
 *           example: I am interested in this role because my MERN experience matches the requirements.
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           description: Resume URL captured when the application was submitted
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         statusHistory:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ApplicationStatusHistoryItem"
 *         reviewedBy:
 *           oneOf:
 *             - $ref: "#/components/schemas/ObjectId"
 *             - $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CandidateApplicationJob:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - location
 *         - employmentType
 *         - workplaceType
 *         - experienceLevel
 *         - status
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *
 *     ApplicationCompanySummary:
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
 *         industry:
 *           type: string
 *           example: Software Development
 *         headquarters:
 *           type: string
 *           example: Pune, Maharashtra
 *
 *     CandidateApplication:
 *       type: object
 *       required:
 *         - _id
 *         - jobId
 *         - candidateId
 *         - candidateUserId
 *         - companyId
 *         - coverLetter
 *         - resumeUrl
 *         - status
 *         - statusHistory
 *         - reviewedBy
 *         - appliedAt
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/CandidateApplicationJob"
 *         candidateId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateUserId:
 *           $ref: "#/components/schemas/ObjectId"
 *         companyId:
 *           $ref: "#/components/schemas/ApplicationCompanySummary"
 *         coverLetter:
 *           type: string
 *           maxLength: 5000
 *           nullable: true
 *         resumeUrl:
 *           type: string
 *           format: uri
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         statusHistory:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ApplicationStatusHistoryItem"
 *         reviewedBy:
 *           oneOf:
 *             - $ref: "#/components/schemas/ObjectId"
 *             - $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaginatedCandidateApplications:
 *       type: object
 *       required:
 *         - applications
 *         - pagination
 *       properties:
 *         applications:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/CandidateApplication"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *
 *     CandidateApplicationSummary:
 *       type: object
 *       required:
 *         - totalApplications
 *         - statusCounts
 *       properties:
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           example: 12
 *         statusCounts:
 *           $ref: "#/components/schemas/ApplicationStatusCounts"
 *
 *     ManagedApplicationJobSummary:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - status
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *           example: MERN Stack Developer
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *
 *     ManagedApplicationCandidate:
 *       type: object
 *       required:
 *         - _id
 *         - firstName
 *         - lastName
 *         - headline
 *         - skills
 *         - experienceLevel
 *         - location
 *         - resumeUrl
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
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *
 *     LegacyManagedApplication:
 *       type: object
 *       required:
 *         - _id
 *         - jobId
 *         - candidateId
 *         - candidateUserId
 *         - companyId
 *         - status
 *         - statusHistory
 *         - appliedAt
 *         - match
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/ManagedApplicationJobSummary"
 *         candidateId:
 *           $ref: "#/components/schemas/ManagedApplicationCandidate"
 *         candidateUserId:
 *           $ref: "#/components/schemas/ApplicationUserSummary"
 *         companyId:
 *           $ref: "#/components/schemas/ObjectId"
 *         coverLetter:
 *           type: string
 *           nullable: true
 *         resumeUrl:
 *           type: string
 *           format: uri
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         statusHistory:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ApplicationStatusHistoryItem"
 *         reviewedBy:
 *           $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         match:
 *           $ref: "#/components/schemas/ApplicationListMatch"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaginatedManagedApplications:
 *       type: object
 *       required:
 *         - applications
 *         - pagination
 *       properties:
 *         applications:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/LegacyManagedApplication"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *
 *     ApplicationJobBestMatch:
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
 *     ManagedApplicationJob:
 *       type: object
 *       required:
 *         - _id
 *         - title
 *         - status
 *         - location
 *         - employmentType
 *         - workplaceType
 *         - experienceLevel
 *         - createdAt
 *         - applicationCount
 *         - lastApplicationAt
 *         - bestMatch
 *         - statusCounts
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
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         applicationCount:
 *           type: integer
 *           minimum: 0
 *           example: 15
 *         lastApplicationAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         bestMatch:
 *           $ref: "#/components/schemas/ApplicationJobBestMatch"
 *         statusCounts:
 *           $ref: "#/components/schemas/ApplicationStatusCounts"
 *
 *     PaginatedManagedApplicationJobs:
 *       type: object
 *       required:
 *         - jobs
 *         - pagination
 *       properties:
 *         jobs:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ManagedApplicationJob"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *
 *     ManagedApplicationListCandidate:
 *       type: object
 *       nullable: true
 *       required:
 *         - _id
 *         - firstName
 *         - lastName
 *         - headline
 *         - location
 *         - experienceLevel
 *         - skills
 *         - resumeUrl
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
 *         location:
 *           type: string
 *           example: Pune, Maharashtra
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *
 *     ManagedApplicationListItem:
 *       type: object
 *       required:
 *         - _id
 *         - status
 *         - appliedAt
 *         - reviewedBy
 *         - candidate
 *         - candidateUser
 *         - match
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         reviewedBy:
 *           $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         candidate:
 *           $ref: "#/components/schemas/ManagedApplicationListCandidate"
 *         candidateUser:
 *           $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         match:
 *           $ref: "#/components/schemas/ApplicationListMatch"
 *
 *     ManagedJobApplicationSummary:
 *       type: object
 *       required:
 *         - totalApplications
 *         - statusCounts
 *         - matchCounts
 *       properties:
 *         totalApplications:
 *           type: integer
 *           minimum: 0
 *           example: 15
 *         statusCounts:
 *           $ref: "#/components/schemas/ApplicationStatusCounts"
 *         matchCounts:
 *           $ref: "#/components/schemas/ApplicationMatchCounts"
 *
 *     AiSuggestedShortlistAvailability:
 *       type: object
 *       required:
 *         - eligibleApplicationCount
 *         - requestedLimit
 *         - canGenerate
 *         - blockReason
 *         - shortlist
 *         - usage
 *       properties:
 *         eligibleApplicationCount:
 *           type: integer
 *           minimum: 0
 *           example: 8
 *         requestedLimit:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         canGenerate:
 *           type: boolean
 *           example: true
 *         blockReason:
 *           type: string
 *           enum:
 *             - no_eligible_applications
 *             - feature_unavailable
 *             - daily_limit
 *           nullable: true
 *         shortlist:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           description: Valid cached AI shortlist when one is available
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiCandidateComparisonAvailability:
 *       type: object
 *       required:
 *         - minimumCandidates
 *         - maximumCandidates
 *         - eligibleApplicationCount
 *         - eligibleApplicationIds
 *         - canGenerate
 *         - blockReason
 *         - comparison
 *         - usage
 *       properties:
 *         minimumCandidates:
 *           type: integer
 *           minimum: 2
 *           example: 2
 *         maximumCandidates:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         eligibleApplicationCount:
 *           type: integer
 *           minimum: 0
 *           example: 8
 *         eligibleApplicationIds:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ObjectId"
 *         canGenerate:
 *           type: boolean
 *           example: true
 *         blockReason:
 *           type: string
 *           enum:
 *             - feature_unavailable
 *             - insufficient_candidates
 *             - daily_limit
 *           nullable: true
 *         comparison:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           description: Valid cached candidate comparison when one is available
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     ManagedJobApplications:
 *       type: object
 *       required:
 *         - job
 *         - summary
 *         - aiSuggestedShortlist
 *         - aiCandidateComparison
 *         - applications
 *         - pagination
 *       properties:
 *         job:
 *           $ref: "#/components/schemas/ManagedApplicationJob"
 *         summary:
 *           $ref: "#/components/schemas/ManagedJobApplicationSummary"
 *         aiSuggestedShortlist:
 *           $ref: "#/components/schemas/AiSuggestedShortlistAvailability"
 *         aiCandidateComparison:
 *           $ref: "#/components/schemas/AiCandidateComparisonAvailability"
 *         applications:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ManagedApplicationListItem"
 *         pagination:
 *           $ref: "#/components/schemas/Pagination"
 *
 *     ManagedApplicationDetailCandidate:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         headline:
 *           type: string
 *           nullable: true
 *         summary:
 *           type: string
 *           nullable: true
 *         location:
 *           type: string
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         linkedinUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         githubUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         portfolioUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         targetJobTitles:
 *           type: array
 *           items:
 *             type: string
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *         preferredWorkplaceTypes:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/WorkplaceType"
 *         preferredEmploymentTypes:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/EmploymentType"
 *
 *     ManagedApplicationDetailJob:
 *       type: object
 *       nullable: true
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         location:
 *           type: string
 *         employmentType:
 *           $ref: "#/components/schemas/EmploymentType"
 *         workplaceType:
 *           $ref: "#/components/schemas/WorkplaceType"
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         status:
 *           $ref: "#/components/schemas/JobStatus"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ApplicationAiFeatureAvailability:
 *       type: object
 *       required:
 *         - hasResume
 *         - hasJobData
 *         - hasCandidateData
 *         - canGenerate
 *         - blockReason
 *         - usage
 *       properties:
 *         hasResume:
 *           type: boolean
 *         hasJobData:
 *           type: boolean
 *         hasCandidateData:
 *           type: boolean
 *         canGenerate:
 *           type: boolean
 *         blockReason:
 *           type: string
 *           enum:
 *             - missing_resume
 *             - incomplete_application_data
 *             - daily_limit
 *           nullable: true
 *         review:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           description: Cached AI resume review when available
 *         interviewKit:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           description: Cached AI interview kit when available
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     ManagedApplicationDetails:
 *       type: object
 *       required:
 *         - application
 *         - candidate
 *         - candidateUser
 *         - job
 *         - match
 *         - allowedNextStatuses
 *         - aiResumeReview
 *         - aiInterviewKit
 *       properties:
 *         application:
 *           type: object
 *           required:
 *             - _id
 *             - status
 *             - coverLetter
 *             - resumeUrl
 *             - appliedAt
 *             - reviewedBy
 *             - statusHistory
 *           properties:
 *             _id:
 *               $ref: "#/components/schemas/ObjectId"
 *             status:
 *               $ref: "#/components/schemas/ApplicationStatus"
 *             coverLetter:
 *               type: string
 *               nullable: true
 *             resumeUrl:
 *               type: string
 *               format: uri
 *             appliedAt:
 *               type: string
 *               format: date-time
 *             reviewedBy:
 *               $ref: "#/components/schemas/ApplicationUserSummary"
 *               nullable: true
 *             statusHistory:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ApplicationStatusHistoryItem"
 *         candidate:
 *           $ref: "#/components/schemas/ManagedApplicationDetailCandidate"
 *         candidateUser:
 *           $ref: "#/components/schemas/ApplicationUserSummary"
 *           nullable: true
 *         job:
 *           $ref: "#/components/schemas/ManagedApplicationDetailJob"
 *         match:
 *           $ref: "#/components/schemas/ApplicationMatch"
 *         allowedNextStatuses:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ApplicationStatus"
 *           example:
 *             - screening
 *             - rejected
 *         aiResumeReview:
 *           $ref: "#/components/schemas/ApplicationAiFeatureAvailability"
 *         aiInterviewKit:
 *           $ref: "#/components/schemas/ApplicationAiFeatureAvailability"
 *
 *     ApplyToJobInput:
 *       type: object
 *       properties:
 *         coverLetter:
 *           type: string
 *           maxLength: 5000
 *           nullable: true
 *           example: I am interested in this role because my MERN experience matches the requirements.
 *
 *     UpdateApplicationStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 */

/**
 * @openapi
 * /api/v1/applications/jobs/{jobId}/apply:
 *   post:
 *     tags:
 *       - Applications
 *     operationId: applyToJob
 *     summary: Apply to an open job
 *     description: |
 *       Submits an application for the authenticated candidate.
 *
 *       The candidate must:
 *
 *       - Have a completed candidate profile
 *       - Have an uploaded resume
 *       - Not have previously applied to the same job
 *
 *       The application stores the candidate's current resume URL and
 *       creates a deterministic candidate-to-job match snapshot.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ApplyToJobInput"
 *     responses:
 *       "201":
 *         description: Application submitted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/SubmittedApplication"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Application submitted successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439040
 *                 jobId: 507f1f77bcf86cd799439020
 *                 candidateId: 507f1f77bcf86cd799439030
 *                 candidateUserId: 507f1f77bcf86cd799439011
 *                 companyId: 507f1f77bcf86cd799439012
 *                 coverLetter: I am interested in this role because my MERN experience matches the requirements.
 *                 resumeUrl: https://res.cloudinary.com/example/raw/upload/candidate-resume.pdf
 *                 status: applied
 *                 statusHistory:
 *                   - status: applied
 *                     changedBy: 507f1f77bcf86cd799439011
 *                     changedAt: "2026-08-01T10:00:00.000Z"
 *                 reviewedBy: null
 *                 appliedAt: "2026-08-01T10:00:00.000Z"
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
 *       "409":
 *         $ref: "#/components/responses/Conflict"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: getMyApplicationSummary
 *     summary: Get the candidate's application summary
 *     description: |
 *       Returns the authenticated candidate's total application count
 *       and a count for every application status.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Candidate application summary returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateApplicationSummary"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Application summary fetched successfully
 *               data:
 *                 totalApplications: 12
 *                 statusCounts:
 *                   applied: 5
 *                   screening: 3
 *                   interview: 2
 *                   offer: 1
 *                   hired: 1
 *                   rejected: 0
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
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
 *     operationId: listMyApplications
 *     summary: List the candidate's applications
 *     description: |
 *       Returns the authenticated candidate's applications, ordered from
 *       newest to oldest.
 *
 *       Each result includes a summary of the associated job and company.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/PageQuery"
 *       - $ref: "#/components/parameters/LimitQuery"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         description: Filter by current application status
 *     responses:
 *       "200":
 *         description: Paginated candidate applications returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PaginatedCandidateApplications"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/me", authenticate, authorize(ROLES.CANDIDATE), listMyApplications);

/**
 * @openapi
 * /api/v1/applications/manage:
 *   get:
 *     tags:
 *       - Applications
 *     operationId: listManagedApplications
 *     summary: List company applications
 *     description: |
 *       Returns a paginated cross-job application list for the
 *       authenticated company administrator or active recruiter.
 *
 *       Match snapshots are refreshed when job or candidate matching
 *       information has changed.
 *
 *       Results are sorted by application date.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/PageQuery"
 *       - $ref: "#/components/parameters/LimitQuery"
 *       - in: query
 *         name: jobId
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ObjectId"
 *         description: Filter applications by job
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         description: Filter by application status
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Paginated company applications returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PaginatedManagedApplications"
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
  listManagedApplications,
);

/**
 * @openapi
 * /api/v1/applications/manage/jobs:
 *   get:
 *     tags:
 *       - Applications
 *     operationId: listManagedApplicationJobs
 *     summary: List company jobs with application summaries
 *     description: |
 *       Returns company jobs together with application totals, status
 *       counts, most recent application time, and the best deterministic
 *       match.
 *
 *       Jobs without applications are excluded by default.
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
 *         description: Filter by job status
 *       - in: query
 *         name: includeEmpty
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include jobs that do not have any applications
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - applicationCount
 *             - lastApplicationAt
 *             - title
 *           default: lastApplicationAt
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Paginated job application summaries returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/PaginatedManagedApplicationJobs"
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
  "/manage/jobs",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedApplicationJobs,
);

/**
 * @openapi
 * /api/v1/applications/manage/jobs/{jobId}/applications:
 *   get:
 *     tags:
 *       - Applications
 *     operationId: listManagedJobApplications
 *     summary: List applications for one company job
 *     description: |
 *       Returns applications for a job belonging to the authenticated
 *       company member's company.
 *
 *       Candidate search checks the candidate's name, headline,
 *       location, username, email, and skills.
 *
 *       The summary and AI availability fields are calculated from all
 *       applications for the job, before filtering and pagination.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *       - $ref: "#/components/parameters/PageQuery"
 *       - $ref: "#/components/parameters/LimitQuery"
 *       - $ref: "#/components/parameters/SearchQuery"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - matchScore
 *             - appliedAt
 *             - candidateName
 *           default: matchScore
 *       - $ref: "#/components/parameters/OrderQuery"
 *     responses:
 *       "200":
 *         description: Job applications and summaries returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/ManagedJobApplications"
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
  "/manage/jobs/:jobId/applications",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedJobApplications,
);

/**
 * @openapi
 * /api/v1/applications/manage/jobs/{jobId}/applications/{applicationId}:
 *   get:
 *     tags:
 *       - Applications
 *     operationId: getManagedJobApplicationDetails
 *     summary: Get managed application details
 *     description: |
 *       Returns a detailed application, candidate profile, job
 *       information, deterministic match analysis, valid status
 *       transitions, and AI feature availability.
 *
 *       Valid cached AI results remain available even after the current
 *       daily usage limit is exhausted.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *       - $ref: "#/components/parameters/ApplicationIdPath"
 *     responses:
 *       "200":
 *         description: Detailed managed application returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/ManagedApplicationDetails"
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
  "/manage/jobs/:jobId/applications/:applicationId",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  getManagedJobApplicationDetails,
);

/**
 * @openapi
 * /api/v1/applications/manage/{applicationId}/resume/view:
 *   get:
 *     tags:
 *       - Applications
 *       - Uploads
 *     operationId: viewManagedApplicationResume
 *     summary: View a candidate resume
 *     description: |
 *       Loads the resume currently stored on the linked candidate
 *       profile and proxies it as an inline PDF.
 *
 *       This viewing endpoint uses the candidate profile's current
 *       resume. The application record separately preserves the resume
 *       URL that existed when the candidate applied.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: "#/components/parameters/ApplicationIdPath"
 *     responses:
 *       "200":
 *         description: Candidate resume returned as an inline PDF
 *         headers:
 *           Content-Disposition:
 *             description: Inline filename generated from the candidate's name
 *             schema:
 *               type: string
 *               example: inline; filename="Sahil-Pawar-resume.pdf"
 *           Content-Length:
 *             description: Resume file size in bytes
 *             schema:
 *               type: integer
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "502":
 *         description: The resume could not be loaded from the media provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *             example:
 *               success: false
 *               statusCode: 502
 *               message: Unable to load resume file
 *               errors: []
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
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
 *     operationId: updateApplicationStatus
 *     summary: Move an application through the hiring workflow
 *     description: |
 *       Updates the application status and records the authenticated
 *       company member in the status history.
 *
 *       Allowed transitions:
 *
 *       - `applied` → `screening` or `rejected`
 *       - `screening` → `interview` or `rejected`
 *       - `interview` → `offer` or `rejected`
 *       - `offer` → `hired` or `rejected`
 *       - `hired` and `rejected` are terminal states
 *
 *       Setting the application to its existing status is rejected.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/ApplicationIdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateApplicationStatusInput"
 *     responses:
 *       "200":
 *         description: Application status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/SubmittedApplication"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Application status updated successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439040
 *                 jobId: 507f1f77bcf86cd799439020
 *                 candidateId: 507f1f77bcf86cd799439030
 *                 candidateUserId: 507f1f77bcf86cd799439011
 *                 companyId: 507f1f77bcf86cd799439012
 *                 coverLetter: null
 *                 resumeUrl: https://res.cloudinary.com/example/raw/upload/candidate-resume.pdf
 *                 status: screening
 *                 statusHistory:
 *                   - status: applied
 *                     changedBy: 507f1f77bcf86cd799439011
 *                     changedAt: "2026-08-01T10:00:00.000Z"
 *                   - status: screening
 *                     changedBy: 507f1f77bcf86cd799439014
 *                     changedAt: "2026-08-01T11:00:00.000Z"
 *                 reviewedBy: 507f1f77bcf86cd799439014
 *                 appliedAt: "2026-08-01T10:00:00.000Z"
 *                 createdAt: "2026-08-01T10:00:00.000Z"
 *                 updatedAt: "2026-08-01T11:00:00.000Z"
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
  "/:applicationId/status",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

export default router;
