import express from "express";

import { ROLES } from "../../config/constants.js";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";

import {
  candidateComparisonSchema,
  jobPostSuggestionSchema,
  suggestedShortlistSchema,
} from "./ai.validation.js";

import {
  analyzeCandidateResume,
  checkCandidateJobResumeFit,
  generateApplicationInterviewKit,
  generateJobCandidateComparison,
  generateJobPostSuggestions,
  generateJobSuggestedShortlist,
  getCandidateResumeAnalysis,
  reviewApplicationResumeMatch,
} from "./ai.controller.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   responses:
 *     AiBadGateway:
 *       description: The AI provider or resume source returned an invalid response
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ApiError"
 *           examples:
 *             providerFailure:
 *               summary: AI provider request failed
 *               value:
 *                 success: false
 *                 statusCode: 502
 *                 message: AI provider request failed
 *                 errors: []
 *             invalidProviderJson:
 *               summary: AI provider returned invalid JSON
 *               value:
 *                 success: false
 *                 statusCode: 502
 *                 message: AI provider returned invalid JSON
 *                 errors: []
 *             resumeDownloadFailure:
 *               summary: Resume could not be downloaded
 *               value:
 *                 success: false
 *                 statusCode: 502
 *                 message: Unable to download resume for AI analysis
 *                 errors: []
 *
 *     AiGatewayTimeout:
 *       description: The AI provider did not respond before the configured timeout
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ApiError"
 *           example:
 *             success: false
 *             statusCode: 504
 *             message: AI provider request timed out
 *             errors: []
 *
 *   schemas:
 *     AiJobIdentity:
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
 *     AiApplicationIdentity:
 *       type: object
 *       required:
 *         - _id
 *         - status
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *
 *     AiResumeProject:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - technologies
 *         - impact
 *         - links
 *       properties:
 *         name:
 *           type: string
 *           nullable: true
 *           example: Hireflow
 *         description:
 *           type: string
 *           nullable: true
 *           example: A full-stack hiring and applicant-tracking platform.
 *         technologies:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - React
 *             - Node.js
 *             - Express
 *             - MongoDB
 *         impact:
 *           type: string
 *           nullable: true
 *           example: Implemented secure role-based hiring workflows.
 *         links:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example:
 *             - https://github.com/example/hireflow
 *
 *     AiResumeExperience:
 *       type: object
 *       required:
 *         - title
 *         - company
 *         - duration
 *         - highlights
 *       properties:
 *         title:
 *           type: string
 *           nullable: true
 *           example: Full-Stack Developer Intern
 *         company:
 *           type: string
 *           nullable: true
 *           example: Example Technologies
 *         duration:
 *           type: string
 *           nullable: true
 *           example: January 2026 to June 2026
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *
 *     AiResumeEducation:
 *       type: object
 *       required:
 *         - degree
 *         - institution
 *         - year
 *       properties:
 *         degree:
 *           type: string
 *           nullable: true
 *           example: Bachelor of Computer Applications
 *         institution:
 *           type: string
 *           nullable: true
 *           example: Example University
 *         year:
 *           type: string
 *           nullable: true
 *           example: "2025"
 *
 *     AiExtractedResumeData:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - phone
 *         - location
 *         - summary
 *         - targetRoles
 *         - skills
 *         - programmingLanguages
 *         - frameworks
 *         - databases
 *         - tools
 *         - projects
 *         - experience
 *         - education
 *         - certifications
 *         - links
 *       properties:
 *         fullName:
 *           type: string
 *           nullable: true
 *           example: Sahil Pawar
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: candidate@example.com
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+91 9876543210"
 *         location:
 *           type: string
 *           nullable: true
 *           example: Pune, Maharashtra
 *         summary:
 *           type: string
 *           nullable: true
 *         targetRoles:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - MERN Stack Developer
 *             - Backend Developer
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - JavaScript
 *             - REST APIs
 *         programmingLanguages:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - JavaScript
 *         frameworks:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - React
 *             - Express
 *         databases:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - MongoDB
 *         tools:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Git
 *             - Postman
 *         projects:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiResumeProject"
 *         experience:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiResumeExperience"
 *         education:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiResumeEducation"
 *         certifications:
 *           type: array
 *           items:
 *             type: string
 *         links:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *
 *     AiRecommendedProfileUpdates:
 *       type: object
 *       required:
 *         - headline
 *         - summary
 *         - skills
 *         - targetJobTitles
 *       properties:
 *         headline:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer | React and Node.js
 *         summary:
 *           type: string
 *           nullable: true
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         targetJobTitles:
 *           type: array
 *           items:
 *             type: string
 *
 *     AiResumeEvaluation:
 *       type: object
 *       required:
 *         - resumeScore
 *         - strengths
 *         - weaknesses
 *         - missingKeywords
 *         - atsIssues
 *         - improvementSuggestions
 *         - recommendedProfileUpdates
 *       properties:
 *         resumeScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           nullable: true
 *           example: 78
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *         weaknesses:
 *           type: array
 *           items:
 *             type: string
 *         missingKeywords:
 *           type: array
 *           items:
 *             type: string
 *         atsIssues:
 *           type: array
 *           items:
 *             type: string
 *         improvementSuggestions:
 *           type: array
 *           items:
 *             type: string
 *         recommendedProfileUpdates:
 *           $ref: "#/components/schemas/AiRecommendedProfileUpdates"
 *
 *     AiResumeAnalysis:
 *       type: object
 *       required:
 *         - id
 *         - status
 *         - sourceType
 *         - resumeUrl
 *         - resumePublicId
 *         - resumeSignature
 *         - extracted
 *         - evaluation
 *         - provider
 *         - model
 *         - analyzedAt
 *         - errorMessage
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - completed
 *             - failed
 *           example: completed
 *         sourceType:
 *           type: string
 *           enum:
 *             - candidate_profile_resume
 *             - application_resume
 *           example: candidate_profile_resume
 *         resumeUrl:
 *           type: string
 *           format: uri
 *         resumePublicId:
 *           type: string
 *           nullable: true
 *         resumeSignature:
 *           type: string
 *           description: Signature used to detect whether the resume has changed
 *         extracted:
 *           $ref: "#/components/schemas/AiExtractedResumeData"
 *         evaluation:
 *           $ref: "#/components/schemas/AiResumeEvaluation"
 *         provider:
 *           type: string
 *           nullable: true
 *           example: gemini
 *         model:
 *           type: string
 *           nullable: true
 *           example: gemini-2.0-flash
 *         analyzedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         errorMessage:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AiGeneratedResumeAnalysisResult:
 *       type: object
 *       required:
 *         - reused
 *         - analysis
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *           description: True when an existing completed analysis was returned
 *         analysis:
 *           $ref: "#/components/schemas/AiResumeAnalysis"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiCandidateResumeAnalysisState:
 *       type: object
 *       required:
 *         - hasResume
 *         - isFresh
 *         - analysis
 *         - usage
 *       properties:
 *         hasResume:
 *           type: boolean
 *           example: true
 *         isFresh:
 *           type: boolean
 *           example: true
 *           description: Whether the latest analysis matches the candidate's current resume
 *         analysis:
 *           allOf:
 *             - $ref: "#/components/schemas/AiResumeAnalysis"
 *           nullable: true
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiJobPostSuggestionInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 2
 *           maxLength: 150
 *           example: MERN Stack Developer
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 10000
 *         responsibilities:
 *           type: array
 *           maxItems: 30
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 500
 *         requirements:
 *           type: array
 *           maxItems: 30
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 500
 *         skills:
 *           type: array
 *           maxItems: 30
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 500
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
 *           example: true
 *       description: |
 *         At least one title, description, responsibility, requirement,
 *         or skill must be supplied.
 *
 *     AiJobPostSuggestions:
 *       type: object
 *       required:
 *         - improvedTitle
 *         - improvedDescription
 *         - improvedResponsibilities
 *         - improvedRequirements
 *         - recommendedSkills
 *         - qualityNotes
 *         - missingInformation
 *       properties:
 *         improvedTitle:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer
 *         improvedDescription:
 *           type: string
 *           nullable: true
 *         improvedResponsibilities:
 *           type: array
 *           items:
 *             type: string
 *         improvedRequirements:
 *           type: array
 *           items:
 *             type: string
 *         recommendedSkills:
 *           type: array
 *           items:
 *             type: string
 *         qualityNotes:
 *           type: array
 *           items:
 *             type: string
 *         missingInformation:
 *           type: array
 *           items:
 *             type: string
 *
 *     AiJobPostSuggestionResult:
 *       type: object
 *       required:
 *         - suggestions
 *         - usage
 *         - provider
 *         - model
 *       properties:
 *         suggestions:
 *           $ref: "#/components/schemas/AiJobPostSuggestions"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *         provider:
 *           type: string
 *           example: gemini
 *         model:
 *           type: string
 *           example: gemini-2.0-flash
 *
 *     AiSuggestedShortlistInput:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *           example: 5
 *           description: |
 *             Requested shortlist size. The effective size can be lower
 *             because of the configured AI limit or the number of
 *             eligible applications.
 *
 *     AiShortlistedCandidate:
 *       type: object
 *       required:
 *         - applicationId
 *         - candidateId
 *         - candidateUserId
 *         - candidateName
 *         - headline
 *         - applicationStatus
 *         - matchScore
 *         - matchLabel
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - summary
 *         - strengths
 *         - verificationPoints
 *       properties:
 *         applicationId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateUserId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateName:
 *           type: string
 *           example: Sahil Pawar
 *         headline:
 *           type: string
 *           nullable: true
 *           example: MERN Stack Developer
 *         applicationStatus:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 86
 *         matchLabel:
 *           type: string
 *           example: Excellent match
 *         confidenceLevel:
 *           type: string
 *           nullable: true
 *           example: high
 *         matchedSkills:
 *           type: array
 *           items:
 *             type: string
 *         missingSkills:
 *           type: array
 *           items:
 *             type: string
 *         summary:
 *           type: string
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *         verificationPoints:
 *           type: array
 *           items:
 *             type: string
 *
 *     AiSuggestedShortlist:
 *       type: object
 *       required:
 *         - id
 *         - jobId
 *         - requestedLimit
 *         - totalEligibleCandidates
 *         - candidates
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
 *         requestedLimit:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *         totalEligibleCandidates:
 *           type: integer
 *           minimum: 1
 *           example: 12
 *         candidates:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiShortlistedCandidate"
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
 *     AiSuggestedShortlistResult:
 *       type: object
 *       required:
 *         - reused
 *         - job
 *         - shortlist
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *         job:
 *           $ref: "#/components/schemas/AiJobIdentity"
 *         shortlist:
 *           $ref: "#/components/schemas/AiSuggestedShortlist"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiCandidateComparisonInput:
 *       type: object
 *       required:
 *         - applicationIds
 *       properties:
 *         applicationIds:
 *           type: array
 *           minItems: 2
 *           maxItems: 50
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/ObjectId"
 *           example:
 *             - 507f1f77bcf86cd799439040
 *             - 507f1f77bcf86cd799439041
 *       description: |
 *         All applications must belong to the selected company job.
 *         The configured AI candidate-comparison limit may be lower
 *         than the validation maximum of 50.
 *
 *     AiComparedCandidate:
 *       type: object
 *       required:
 *         - applicationId
 *         - candidateId
 *         - candidateUserId
 *         - candidateName
 *         - headline
 *         - applicationStatus
 *         - matchScore
 *         - matchLabel
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - summary
 *         - strongestEvidence
 *         - concernsToVerify
 *       properties:
 *         applicationId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateUserId:
 *           $ref: "#/components/schemas/ObjectId"
 *         candidateName:
 *           type: string
 *           example: Sahil Pawar
 *         headline:
 *           type: string
 *           nullable: true
 *         applicationStatus:
 *           $ref: "#/components/schemas/ApplicationStatus"
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 86
 *         matchLabel:
 *           type: string
 *           example: Excellent match
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 90
 *         confidenceLevel:
 *           type: string
 *           nullable: true
 *           example: high
 *         matchedSkills:
 *           type: array
 *           items:
 *             type: string
 *         missingSkills:
 *           type: array
 *           items:
 *             type: string
 *         summary:
 *           type: string
 *         strongestEvidence:
 *           type: array
 *           items:
 *             type: string
 *         concernsToVerify:
 *           type: array
 *           items:
 *             type: string
 *
 *     AiCandidateComparison:
 *       type: object
 *       required:
 *         - id
 *         - jobId
 *         - selectedCandidateCount
 *         - comparisonSummary
 *         - sharedStrengths
 *         - keyDifferences
 *         - interviewFocus
 *         - candidates
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
 *         selectedCandidateCount:
 *           type: integer
 *           minimum: 2
 *           example: 2
 *         comparisonSummary:
 *           type: string
 *         sharedStrengths:
 *           type: array
 *           items:
 *             type: string
 *         keyDifferences:
 *           type: array
 *           items:
 *             type: string
 *         interviewFocus:
 *           type: array
 *           items:
 *             type: string
 *         candidates:
 *           type: array
 *           minItems: 2
 *           items:
 *             $ref: "#/components/schemas/AiComparedCandidate"
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
 *     AiCandidateComparisonResult:
 *       type: object
 *       required:
 *         - reused
 *         - job
 *         - comparison
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *         job:
 *           $ref: "#/components/schemas/AiJobIdentity"
 *         comparison:
 *           $ref: "#/components/schemas/AiCandidateComparison"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiJobResumeFitResult:
 *       type: object
 *       required:
 *         - reused
 *         - job
 *         - fit
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *         job:
 *           $ref: "#/components/schemas/AiJobIdentity"
 *         fit:
 *           $ref: "#/components/schemas/JobResumeFit"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiResumeMatchedEvidence:
 *       type: object
 *       required:
 *         - requirement
 *         - evidence
 *       properties:
 *         requirement:
 *           type: string
 *           nullable: true
 *         evidence:
 *           type: string
 *
 *     AiApplicationResumeReview:
 *       type: object
 *       required:
 *         - applicationId
 *         - jobId
 *         - resumeAnalysisId
 *         - enhancedMatchScore
 *         - matchBasis
 *         - alignmentLevel
 *         - profileScore
 *         - resumeBoost
 *         - confidenceScore
 *         - confidenceLevel
 *         - matchedSkills
 *         - missingSkills
 *         - resumeEvidence
 *         - summary
 *         - matchedEvidence
 *         - missingOrWeakAreas
 *         - resumeStrengths
 *         - interviewFocus
 *         - riskNotes
 *         - provider
 *         - model
 *         - generatedAt
 *       properties:
 *         applicationId:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/ObjectId"
 *         resumeAnalysisId:
 *           allOf:
 *             - $ref: "#/components/schemas/ObjectId"
 *           nullable: true
 *         enhancedMatchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 86
 *         matchBasis:
 *           $ref: "#/components/schemas/RecommendationMatchBasis"
 *         alignmentLevel:
 *           type: string
 *           example: Excellent match
 *         profileScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 78
 *         resumeBoost:
 *           type: number
 *           minimum: 0
 *           example: 8
 *         confidenceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 90
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
 *         matchedEvidence:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiResumeMatchedEvidence"
 *         missingOrWeakAreas:
 *           type: array
 *           items:
 *             type: string
 *         resumeStrengths:
 *           type: array
 *           items:
 *             type: string
 *         interviewFocus:
 *           type: array
 *           items:
 *             type: string
 *         riskNotes:
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
 *
 *     AiApplicationResumeReviewResult:
 *       type: object
 *       required:
 *         - reused
 *         - application
 *         - job
 *         - review
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *         application:
 *           $ref: "#/components/schemas/AiApplicationIdentity"
 *         job:
 *           $ref: "#/components/schemas/AiJobIdentity"
 *         review:
 *           $ref: "#/components/schemas/AiApplicationResumeReview"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 *
 *     AiInterviewQuestion:
 *       type: object
 *       required:
 *         - question
 *         - whyAsk
 *       properties:
 *         question:
 *           type: string
 *           example: Explain how you designed authentication in your MERN project.
 *         whyAsk:
 *           type: string
 *           nullable: true
 *           example: Tests practical understanding of secure authentication architecture.
 *
 *     AiInterviewKit:
 *       type: object
 *       required:
 *         - applicationId
 *         - jobId
 *         - resumeAnalysisId
 *         - technicalQuestions
 *         - projectQuestions
 *         - skillGapQuestions
 *         - behavioralQuestions
 *         - evaluationChecklist
 *         - provider
 *         - model
 *         - generatedAt
 *       properties:
 *         applicationId:
 *           $ref: "#/components/schemas/ObjectId"
 *         jobId:
 *           $ref: "#/components/schemas/ObjectId"
 *         resumeAnalysisId:
 *           allOf:
 *             - $ref: "#/components/schemas/ObjectId"
 *           nullable: true
 *         technicalQuestions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiInterviewQuestion"
 *         projectQuestions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiInterviewQuestion"
 *         skillGapQuestions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiInterviewQuestion"
 *         behavioralQuestions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/AiInterviewQuestion"
 *         evaluationChecklist:
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
 *
 *     AiInterviewKitResult:
 *       type: object
 *       required:
 *         - reused
 *         - application
 *         - job
 *         - interviewKit
 *         - usage
 *       properties:
 *         reused:
 *           type: boolean
 *           example: false
 *         application:
 *           $ref: "#/components/schemas/AiApplicationIdentity"
 *         job:
 *           $ref: "#/components/schemas/AiJobIdentity"
 *         interviewKit:
 *           $ref: "#/components/schemas/AiInterviewKit"
 *         usage:
 *           $ref: "#/components/schemas/AiUsageState"
 */

router.use(authenticate);

/**
 * @openapi
 * /api/v1/ai/candidates/resume/analyze:
 *   post:
 *     tags:
 *       - AI
 *     operationId: analyzeCandidateResume
 *     summary: Generate AI insights for the candidate's current resume
 *     description: |
 *       Downloads and analyzes the resume stored on the authenticated
 *       candidate's profile.
 *
 *       The structured result includes:
 *
 *       - Extracted contact and professional information
 *       - Skills, tools, projects, education, and experience
 *       - Resume score
 *       - Strengths and weaknesses
 *       - ATS issues and missing keywords
 *       - Improvement suggestions
 *       - Recommended candidate-profile updates
 *
 *       An existing completed analysis is reused when the candidate's
 *       current resume signature has not changed. Reusing an analysis
 *       does not consume another AI usage allowance.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     responses:
 *       "200":
 *         description: A matching completed analysis already existed and was reused
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiGeneratedResumeAnalysisResult"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: AI Resume Insights already available for this resume
 *               data:
 *                 reused: true
 *                 analysis:
 *                   id: 507f1f77bcf86cd799439050
 *                   status: completed
 *                   sourceType: candidate_profile_resume
 *                   resumeUrl: https://res.cloudinary.com/example/raw/upload/resume.pdf
 *                   resumePublicId: hireflow/resumes/candidate-resume
 *                   resumeSignature: resume-signature
 *                   extracted:
 *                     fullName: Sahil Pawar
 *                     email: candidate@example.com
 *                     phone: "+91 9876543210"
 *                     location: Pune, Maharashtra
 *                     summary: Full-stack developer focused on MERN applications.
 *                     targetRoles:
 *                       - MERN Stack Developer
 *                     skills:
 *                       - JavaScript
 *                       - REST APIs
 *                     programmingLanguages:
 *                       - JavaScript
 *                     frameworks:
 *                       - React
 *                       - Express
 *                     databases:
 *                       - MongoDB
 *                     tools:
 *                       - Git
 *                     projects: []
 *                     experience: []
 *                     education: []
 *                     certifications: []
 *                     links: []
 *                   evaluation:
 *                     resumeScore: 78
 *                     strengths:
 *                       - Strong project experience
 *                     weaknesses:
 *                       - Limited quantified achievements
 *                     missingKeywords:
 *                       - Docker
 *                     atsIssues: []
 *                     improvementSuggestions:
 *                       - Add measurable project impact
 *                     recommendedProfileUpdates:
 *                       headline: MERN Stack Developer
 *                       summary: Full-stack developer focused on secure MERN applications.
 *                       skills:
 *                         - JavaScript
 *                         - React
 *                         - Node.js
 *                       targetJobTitles:
 *                         - MERN Stack Developer
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   analyzedAt: "2026-08-01T10:00:00.000Z"
 *                   errorMessage: null
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   updatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: resume_analysis
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "201":
 *         description: A new AI resume analysis was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiGeneratedResumeAnalysisResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Resume Insights generated successfully
 *               data:
 *                 reused: false
 *                 analysis:
 *                   id: 507f1f77bcf86cd799439050
 *                   status: completed
 *                   sourceType: candidate_profile_resume
 *                   resumeUrl: https://res.cloudinary.com/example/raw/upload/resume.pdf
 *                   resumePublicId: hireflow/resumes/candidate-resume
 *                   resumeSignature: resume-signature
 *                   extracted:
 *                     fullName: Sahil Pawar
 *                     email: candidate@example.com
 *                     phone: "+91 9876543210"
 *                     location: Pune, Maharashtra
 *                     summary: Full-stack developer focused on MERN applications.
 *                     targetRoles:
 *                       - MERN Stack Developer
 *                     skills:
 *                       - JavaScript
 *                     programmingLanguages:
 *                       - JavaScript
 *                     frameworks:
 *                       - React
 *                       - Express
 *                     databases:
 *                       - MongoDB
 *                     tools:
 *                       - Git
 *                     projects: []
 *                     experience: []
 *                     education: []
 *                     certifications: []
 *                     links: []
 *                   evaluation:
 *                     resumeScore: 78
 *                     strengths: []
 *                     weaknesses: []
 *                     missingKeywords: []
 *                     atsIssues: []
 *                     improvementSuggestions: []
 *                     recommendedProfileUpdates:
 *                       headline: MERN Stack Developer
 *                       summary: null
 *                       skills: []
 *                       targetJobTitles: []
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   analyzedAt: "2026-08-01T10:00:00.000Z"
 *                   errorMessage: null
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   updatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: resume_analysis
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/candidates/resume/analyze",
  authorize(ROLES.CANDIDATE),
  analyzeCandidateResume,
);

/**
 * @openapi
 * /api/v1/ai/candidates/resume/analysis:
 *   get:
 *     tags:
 *       - AI
 *     operationId: getCandidateResumeAnalysis
 *     summary: Get the candidate's latest resume-analysis state
 *     description: |
 *       Returns the latest stored resume analysis and current usage
 *       state for the authenticated candidate.
 *
 *       When no resume has been uploaded, `hasResume` is false and
 *       `analysis` is null.
 *
 *       When the resume has changed since the latest analysis,
 *       `isFresh` is false.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Candidate resume-analysis state returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiCandidateResumeAnalysisState"
 *             examples:
 *               currentAnalysis:
 *                 summary: Current completed analysis
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: AI Resume Insights fetched successfully
 *                   data:
 *                     hasResume: true
 *                     isFresh: true
 *                     analysis:
 *                       id: 507f1f77bcf86cd799439050
 *                       status: completed
 *                       sourceType: candidate_profile_resume
 *                       resumeUrl: https://res.cloudinary.com/example/raw/upload/resume.pdf
 *                       resumePublicId: hireflow/resumes/candidate-resume
 *                       resumeSignature: resume-signature
 *                       extracted:
 *                         fullName: Sahil Pawar
 *                         email: candidate@example.com
 *                         phone: null
 *                         location: Pune, Maharashtra
 *                         summary: null
 *                         targetRoles: []
 *                         skills: []
 *                         programmingLanguages: []
 *                         frameworks: []
 *                         databases: []
 *                         tools: []
 *                         projects: []
 *                         experience: []
 *                         education: []
 *                         certifications: []
 *                         links: []
 *                       evaluation:
 *                         resumeScore: 78
 *                         strengths: []
 *                         weaknesses: []
 *                         missingKeywords: []
 *                         atsIssues: []
 *                         improvementSuggestions: []
 *                         recommendedProfileUpdates:
 *                           headline: null
 *                           summary: null
 *                           skills: []
 *                           targetJobTitles: []
 *                       provider: gemini
 *                       model: gemini-2.0-flash
 *                       analyzedAt: "2026-08-01T10:00:00.000Z"
 *                       errorMessage: null
 *                       createdAt: "2026-08-01T10:00:00.000Z"
 *                       updatedAt: "2026-08-01T10:00:00.000Z"
 *                     usage:
 *                       featureKey: resume_analysis
 *                       limit: 5
 *                       used: 1
 *                       remaining: 4
 *                       dateKey: "2026-08-01"
 *                       resetAt: "2026-08-02T00:00:00.000Z"
 *               noResume:
 *                 summary: Candidate has no uploaded resume
 *                 value:
 *                   statusCode: 200
 *                   success: true
 *                   message: AI Resume Insights fetched successfully
 *                   data:
 *                     hasResume: false
 *                     isFresh: false
 *                     analysis: null
 *                     usage:
 *                       featureKey: resume_analysis
 *                       limit: 5
 *                       used: 0
 *                       remaining: 5
 *                       dateKey: "2026-08-01"
 *                       resetAt: "2026-08-02T00:00:00.000Z"
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
  "/candidates/resume/analysis",
  authorize(ROLES.CANDIDATE),
  getCandidateResumeAnalysis,
);

/**
 * @openapi
 * /api/v1/ai/jobs/post-suggestions:
 *   post:
 *     tags:
 *       - AI
 *     operationId: generateJobPostSuggestions
 *     summary: Generate job-post improvement suggestions
 *     description: |
 *       Uses the authenticated company administrator's or active
 *       recruiter's company profile and a partial job draft to produce
 *       improved job-post content.
 *
 *       At least one title, description, responsibility, requirement,
 *       or skill must be included.
 *
 *       Salary values are optional. When both are supplied,
 *       `salaryMax` must be greater than or equal to `salaryMin`.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AiJobPostSuggestionInput"
 *           example:
 *             title: MERN Developer
 *             description: Build web applications for our hiring platform.
 *             responsibilities:
 *               - Develop React interfaces
 *               - Build Node.js APIs
 *             requirements:
 *               - Strong JavaScript fundamentals
 *             skills:
 *               - React
 *               - Node.js
 *               - MongoDB
 *             location: Pune, Maharashtra
 *             employmentType: full-time
 *             workplaceType: hybrid
 *             experienceLevel: entry
 *             salaryMin: 500000
 *             salaryMax: 900000
 *             salaryCurrency: INR
 *             isSalaryVisible: true
 *     responses:
 *       "200":
 *         description: AI job-post suggestions generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiJobPostSuggestionResult"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: AI Job Post Assistant suggestions generated successfully
 *               data:
 *                 suggestions:
 *                   improvedTitle: MERN Stack Developer
 *                   improvedDescription: Join our engineering team to build secure and scalable hiring applications.
 *                   improvedResponsibilities:
 *                     - Build reusable React components
 *                     - Develop secure Node.js and Express APIs
 *                   improvedRequirements:
 *                     - Strong JavaScript fundamentals
 *                     - Practical experience with React and Node.js
 *                   recommendedSkills:
 *                     - JavaScript
 *                     - React
 *                     - Node.js
 *                     - Express
 *                     - MongoDB
 *                   qualityNotes:
 *                     - The responsibilities now use clear action-oriented wording.
 *                   missingInformation:
 *                     - Consider adding benefits and the interview process.
 *                 usage:
 *                   featureKey: job_post_suggestion
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *                 provider: gemini
 *                 model: gemini-2.0-flash
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/jobs/post-suggestions",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(jobPostSuggestionSchema),
  generateJobPostSuggestions,
);

/**
 * @openapi
 * /api/v1/ai/jobs/{jobId}/suggested-shortlist:
 *   post:
 *     tags:
 *       - AI
 *     operationId: generateJobSuggestedShortlist
 *     summary: Generate an AI-assisted shortlist for one company job
 *     description: |
 *       Generates a shortlist from eligible applications belonging to
 *       the authenticated company member's job.
 *
 *       Eligible application statuses are:
 *
 *       - `applied`
 *       - `screening`
 *       - `interview`
 *
 *       Deterministic match scores decide which candidates enter the
 *       requested shortlist. AI produces summaries, strengths, and
 *       verification points without changing the deterministic scores
 *       or ordering.
 *
 *       A cached shortlist is reused when the job, candidate evidence,
 *       and effective shortlist size have not changed.
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
 *             $ref: "#/components/schemas/AiSuggestedShortlistInput"
 *           example:
 *             limit: 5
 *     responses:
 *       "200":
 *         description: A matching cached shortlist already existed and was reused
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiSuggestedShortlistResult"
 *       "201":
 *         description: A new AI-assisted shortlist was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiSuggestedShortlistResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Suggested Shortlist generated successfully
 *               data:
 *                 reused: false
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 shortlist:
 *                   id: 507f1f77bcf86cd799439060
 *                   jobId: 507f1f77bcf86cd799439020
 *                   requestedLimit: 2
 *                   totalEligibleCandidates: 8
 *                   candidates:
 *                     - applicationId: 507f1f77bcf86cd799439040
 *                       candidateId: 507f1f77bcf86cd799439030
 *                       candidateUserId: 507f1f77bcf86cd799439011
 *                       candidateName: Sahil Pawar
 *                       headline: MERN Stack Developer
 *                       applicationStatus: screening
 *                       matchScore: 86
 *                       matchLabel: Excellent match
 *                       confidenceLevel: high
 *                       matchedSkills:
 *                         - JavaScript
 *                         - React
 *                         - Node.js
 *                       missingSkills:
 *                         - Docker
 *                       summary: Strong candidate based on available job-related evidence.
 *                       strengths:
 *                         - Strong MERN project experience
 *                       verificationPoints:
 *                         - Verify practical Docker experience
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   generatedAt: "2026-08-01T10:00:00.000Z"
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   updatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: shortlist
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/jobs/:jobId/suggested-shortlist",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(suggestedShortlistSchema),
  generateJobSuggestedShortlist,
);

/**
 * @openapi
 * /api/v1/ai/jobs/{jobId}/candidate-comparison:
 *   post:
 *     tags:
 *       - AI
 *     operationId: generateJobCandidateComparison
 *     summary: Compare selected candidates for one company job
 *     description: |
 *       Compares two or more selected applications belonging to the
 *       authenticated company member's job.
 *
 *       Deterministic match scores remain the source of truth. AI adds
 *       comparison summaries, shared strengths, key differences,
 *       strongest evidence, concerns to verify, and interview focus.
 *
 *       Duplicate application IDs are removed during validation.
 *
 *       A cached comparison is reused when the job and selected
 *       candidate evidence have not changed.
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
 *             $ref: "#/components/schemas/AiCandidateComparisonInput"
 *     responses:
 *       "200":
 *         description: A matching cached comparison already existed and was reused
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiCandidateComparisonResult"
 *       "201":
 *         description: A new AI candidate comparison was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiCandidateComparisonResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Candidate Comparison generated successfully
 *               data:
 *                 reused: false
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 comparison:
 *                   id: 507f1f77bcf86cd799439061
 *                   jobId: 507f1f77bcf86cd799439020
 *                   selectedCandidateCount: 2
 *                   comparisonSummary: Both candidates have relevant MERN experience, with different strengths.
 *                   sharedStrengths:
 *                     - JavaScript
 *                     - React
 *                   keyDifferences:
 *                     - The first candidate has stronger backend experience.
 *                     - The second candidate has stronger frontend experience.
 *                   interviewFocus:
 *                     - Verify production API-design experience.
 *                   candidates:
 *                     - applicationId: 507f1f77bcf86cd799439040
 *                       candidateId: 507f1f77bcf86cd799439030
 *                       candidateUserId: 507f1f77bcf86cd799439011
 *                       candidateName: Sahil Pawar
 *                       headline: MERN Stack Developer
 *                       applicationStatus: screening
 *                       matchScore: 86
 *                       matchLabel: Excellent match
 *                       confidenceScore: 90
 *                       confidenceLevel: high
 *                       matchedSkills:
 *                         - JavaScript
 *                         - React
 *                         - Node.js
 *                       missingSkills:
 *                         - Docker
 *                       summary: Strong full-stack candidate.
 *                       strongestEvidence:
 *                         - Built multiple MERN applications
 *                       concernsToVerify:
 *                         - Verify Docker experience
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   generatedAt: "2026-08-01T10:00:00.000Z"
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   updatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: candidate_comparison
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/jobs/:jobId/candidate-comparison",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(candidateComparisonSchema),
  generateJobCandidateComparison,
);

/**
 * @openapi
 * /api/v1/ai/jobs/{jobId}/resume-fit:
 *   post:
 *     tags:
 *       - AI
 *     operationId: checkCandidateJobResumeFit
 *     summary: Generate an AI resume-fit analysis for one open job
 *     description: |
 *       Generates a deeper resume-to-job fit analysis for the
 *       authenticated candidate.
 *
 *       The candidate must have:
 *
 *       - A candidate profile
 *       - An uploaded resume
 *       - Current completed AI Resume Insights
 *
 *       The deterministic matching engine supplies the score, matched
 *       skills, missing skills, confidence, and resume evidence. AI adds
 *       the summary, matched requirements, missing requirements,
 *       improvement guidance, and before-applying checklist.
 *
 *       A cached fit is reused when the job and resume signatures have
 *       not changed.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/JobIdPath"
 *     responses:
 *       "200":
 *         description: A matching cached resume fit already existed and was reused
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiJobResumeFitResult"
 *       "201":
 *         description: A new AI resume fit was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiJobResumeFitResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Resume Fit generated successfully
 *               data:
 *                 reused: false
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 fit:
 *                   id: 507f1f77bcf86cd799439062
 *                   jobId: 507f1f77bcf86cd799439020
 *                   resumeAnalysisId: 507f1f77bcf86cd799439050
 *                   enhancedMatchScore: 84
 *                   matchLabel: Strong match
 *                   matchBasis: profile_and_resume
 *                   profileScore: 76
 *                   resumeBoost: 8
 *                   confidenceScore: 88
 *                   confidenceLevel: high
 *                   matchedSkills:
 *                     - JavaScript
 *                     - React
 *                     - Node.js
 *                   missingSkills:
 *                     - Docker
 *                   resumeEvidence:
 *                     - A resume project includes technologies relevant to this role.
 *                   summary: The resume demonstrates strong alignment with the role.
 *                   matchedRequirements:
 *                     - Practical React experience
 *                   missingRequirements:
 *                     - Docker experience is not clearly demonstrated
 *                   resumeImprovements:
 *                     - Add measurable project outcomes
 *                   profileImprovements:
 *                     - Add Docker after gaining practical experience
 *                   beforeApplyingChecklist:
 *                     - Add quantified project achievements
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   generatedAt: "2026-08-01T10:00:00.000Z"
 *                   createdAt: "2026-08-01T10:00:00.000Z"
 *                   updatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: job_resume_fit
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/jobs/:jobId/resume-fit",
  authorize(ROLES.CANDIDATE),
  checkCandidateJobResumeFit,
);

/**
 * @openapi
 * /api/v1/ai/applications/{applicationId}/resume-review:
 *   post:
 *     tags:
 *       - AI
 *     operationId: reviewApplicationResumeMatch
 *     summary: Generate an AI resume-match review for an application
 *     description: |
 *       Reviews the resume captured when the candidate submitted the
 *       application against the associated job.
 *
 *       The application must belong to the authenticated company
 *       administrator's or active recruiter's company.
 *
 *       The deterministic matching engine supplies the score and
 *       matching evidence. AI adds a structured summary, strengths,
 *       weak areas, evidence, interview focus, and risk notes.
 *
 *       A cached review is reused when the job and submitted-resume
 *       signatures have not changed.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/ApplicationIdPath"
 *     responses:
 *       "200":
 *         description: A matching cached application resume review already existed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiApplicationResumeReviewResult"
 *       "201":
 *         description: A new application resume review was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiApplicationResumeReviewResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Resume Match Review generated successfully
 *               data:
 *                 reused: false
 *                 application:
 *                   _id: 507f1f77bcf86cd799439040
 *                   status: screening
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 review:
 *                   applicationId: 507f1f77bcf86cd799439040
 *                   jobId: 507f1f77bcf86cd799439020
 *                   resumeAnalysisId: 507f1f77bcf86cd799439050
 *                   enhancedMatchScore: 86
 *                   matchBasis: profile_and_resume
 *                   alignmentLevel: Excellent match
 *                   profileScore: 78
 *                   resumeBoost: 8
 *                   confidenceScore: 90
 *                   confidenceLevel: high
 *                   matchedSkills:
 *                     - JavaScript
 *                     - React
 *                     - Node.js
 *                   missingSkills:
 *                     - Docker
 *                   resumeEvidence:
 *                     - A resume project includes technologies relevant to this role.
 *                   summary: The submitted resume aligns strongly with the role.
 *                   matchedEvidence:
 *                     - requirement: React experience
 *                       evidence: The candidate describes multiple React projects.
 *                   missingOrWeakAreas:
 *                     - Docker experience is not clearly demonstrated.
 *                   resumeStrengths:
 *                     - Strong full-stack project evidence
 *                   interviewFocus:
 *                     - Ask about API-security decisions
 *                   riskNotes:
 *                     - Production deployment experience should be verified
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   generatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: company_resume_review
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/applications/:applicationId/resume-review",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  reviewApplicationResumeMatch,
);

/**
 * @openapi
 * /api/v1/ai/applications/{applicationId}/interview-kit:
 *   post:
 *     tags:
 *       - AI
 *     operationId: generateApplicationInterviewKit
 *     summary: Generate a structured interview kit for an application
 *     description: |
 *       Generates interview questions and an evaluation checklist for
 *       an application belonging to the authenticated company
 *       administrator's or active recruiter's company.
 *
 *       The interview kit uses the job, candidate profile, submitted
 *       resume analysis, deterministic match, and an existing current
 *       resume review when available.
 *
 *       The kit includes:
 *
 *       - Technical questions
 *       - Project questions
 *       - Skill-gap questions
 *       - Behavioral questions
 *       - Evaluation checklist
 *
 *       A cached interview kit is reused when the job and submitted
 *       resume signatures have not changed.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: "#/components/parameters/ApplicationIdPath"
 *     responses:
 *       "200":
 *         description: A matching cached interview kit already existed and was reused
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiInterviewKitResult"
 *       "201":
 *         description: A new AI interview kit was generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AiInterviewKitResult"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: AI Interview Kit generated successfully
 *               data:
 *                 reused: false
 *                 application:
 *                   _id: 507f1f77bcf86cd799439040
 *                   status: interview
 *                 job:
 *                   _id: 507f1f77bcf86cd799439020
 *                   title: MERN Stack Developer
 *                 interviewKit:
 *                   applicationId: 507f1f77bcf86cd799439040
 *                   jobId: 507f1f77bcf86cd799439020
 *                   resumeAnalysisId: 507f1f77bcf86cd799439050
 *                   technicalQuestions:
 *                     - question: Explain how you would secure authentication in a MERN application.
 *                       whyAsk: Evaluates practical authentication and API-security knowledge.
 *                   projectQuestions:
 *                     - question: Describe the architecture of your Hireflow project.
 *                       whyAsk: Tests system-design and project-ownership depth.
 *                   skillGapQuestions:
 *                     - question: What experience do you have using Docker?
 *                       whyAsk: Docker was not clearly demonstrated in the resume.
 *                   behavioralQuestions:
 *                     - question: Describe a production issue you diagnosed and resolved.
 *                       whyAsk: Evaluates problem-solving and ownership.
 *                   evaluationChecklist:
 *                     - Explains authentication trade-offs clearly
 *                     - Demonstrates practical React and Node.js experience
 *                     - Provides specific project examples
 *                   provider: gemini
 *                   model: gemini-2.0-flash
 *                   generatedAt: "2026-08-01T10:00:00.000Z"
 *                 usage:
 *                   featureKey: interview_kit
 *                   limit: 5
 *                   used: 1
 *                   remaining: 4
 *                   dateKey: "2026-08-01"
 *                   resetAt: "2026-08-02T00:00:00.000Z"
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "429":
 *         $ref: "#/components/responses/TooManyRequests"
 *       "502":
 *         $ref: "#/components/responses/AiBadGateway"
 *       "503":
 *         $ref: "#/components/responses/ServiceUnavailable"
 *       "504":
 *         $ref: "#/components/responses/AiGatewayTimeout"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/applications/:applicationId/interview-kit",
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  generateApplicationInterviewKit,
);

export default router;
