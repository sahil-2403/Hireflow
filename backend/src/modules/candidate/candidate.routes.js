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

/**
 * @openapi
 * components:
 *   schemas:
 *     CandidateAccountSummary:
 *       type: object
 *       required:
 *         - _id
 *         - username
 *         - email
 *         - role
 *         - isEmailVerified
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
 *         role:
 *           type: string
 *           enum:
 *             - candidate
 *           example: candidate
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *
 *     CandidateProfileCore:
 *       type: object
 *       required:
 *         - _id
 *         - firstName
 *         - lastName
 *         - phone
 *         - headline
 *         - summary
 *         - skills
 *         - experienceLevel
 *         - location
 *         - targetJobTitles
 *         - preferredLocations
 *         - preferredWorkplaceTypes
 *         - preferredEmploymentTypes
 *         - resumeUrl
 *         - resumePublicId
 *         - linkedinUrl
 *         - githubUrl
 *         - portfolioUrl
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         _id:
 *           $ref: "#/components/schemas/ObjectId"
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Sahil
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Pawar
 *         phone:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "+91 9876543210"
 *         headline:
 *           type: string
 *           maxLength: 150
 *           nullable: true
 *           example: MERN Stack Developer
 *         summary:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           example: Full-stack developer focused on secure and maintainable web applications.
 *         skills:
 *           type: array
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - javascript
 *             - react
 *             - node.js
 *             - mongodb
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         targetJobTitles:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *           example:
 *             - mern stack developer
 *             - backend developer
 *         preferredLocations:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *           example:
 *             - pune
 *             - mumbai
 *             - bengaluru
 *         preferredWorkplaceTypes:
 *           type: array
 *           maxItems: 3
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/WorkplaceType"
 *           example:
 *             - remote
 *             - hybrid
 *         preferredEmploymentTypes:
 *           type: array
 *           maxItems: 4
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/EmploymentType"
 *           example:
 *             - full-time
 *             - internship
 *         resumeUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://res.cloudinary.com/example/raw/upload/candidate-resume.pdf
 *         resumePublicId:
 *           type: string
 *           nullable: true
 *           description: Cloudinary identifier for the stored resume asset
 *           example: hireflow/resumes/candidate-resume
 *         linkedinUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://www.linkedin.com/in/example
 *         githubUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://github.com/example
 *         portfolioUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.dev
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-01T10:00:00.000Z"
 *
 *     CandidateProfile:
 *       allOf:
 *         - $ref: "#/components/schemas/CandidateProfileCore"
 *         - type: object
 *           required:
 *             - userId
 *           properties:
 *             userId:
 *               $ref: "#/components/schemas/ObjectId"
 *
 *     CandidateProfileWithAccount:
 *       allOf:
 *         - $ref: "#/components/schemas/CandidateProfileCore"
 *         - type: object
 *           required:
 *             - userId
 *           properties:
 *             userId:
 *               $ref: "#/components/schemas/CandidateAccountSummary"
 *
 *     CreateCandidateProfileInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - experienceLevel
 *         - location
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Sahil
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Pawar
 *         phone:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "+91 9876543210"
 *         headline:
 *           type: string
 *           maxLength: 150
 *           nullable: true
 *           example: MERN Stack Developer
 *         summary:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *           example: Full-stack developer focused on secure and maintainable web applications.
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
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           example: Pune, Maharashtra
 *         targetJobTitles:
 *           type: array
 *           default: []
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *           example:
 *             - MERN Stack Developer
 *             - Backend Developer
 *         preferredLocations:
 *           type: array
 *           default: []
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *           example:
 *             - Pune
 *             - Mumbai
 *             - Bengaluru
 *         preferredWorkplaceTypes:
 *           type: array
 *           default: []
 *           maxItems: 3
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/WorkplaceType"
 *           example:
 *             - remote
 *             - hybrid
 *         preferredEmploymentTypes:
 *           type: array
 *           default: []
 *           maxItems: 4
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/EmploymentType"
 *           example:
 *             - full-time
 *             - internship
 *         linkedinUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://www.linkedin.com/in/example
 *         githubUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://github.com/example
 *         portfolioUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.dev
 *
 *     UpdateCandidateProfileInput:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Sahil
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: Pawar
 *         phone:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *         headline:
 *           type: string
 *           maxLength: 150
 *           nullable: true
 *         summary:
 *           type: string
 *           maxLength: 2000
 *           nullable: true
 *         skills:
 *           type: array
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *           example:
 *             - JavaScript
 *             - React
 *             - Node.js
 *             - MongoDB
 *         experienceLevel:
 *           $ref: "#/components/schemas/ExperienceLevel"
 *         location:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         targetJobTitles:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *         preferredLocations:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *         preferredWorkplaceTypes:
 *           type: array
 *           maxItems: 3
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/WorkplaceType"
 *         preferredEmploymentTypes:
 *           type: array
 *           maxItems: 4
 *           uniqueItems: true
 *           items:
 *             $ref: "#/components/schemas/EmploymentType"
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
 */

router.use(authenticate, authorize(ROLES.CANDIDATE));

/**
 * @openapi
 * /api/v1/candidates/profile/resume/view:
 *   get:
 *     tags:
 *       - Candidates
 *       - Uploads
 *     operationId: viewCandidateResume
 *     summary: View the authenticated candidate's resume
 *     description: |
 *       Loads the candidate's stored resume and proxies it back as an
 *       inline PDF response.
 *
 *       The candidate must already have a profile and an uploaded
 *       resume.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Candidate resume returned as an inline PDF
 *         headers:
 *           Content-Disposition:
 *             description: Inline filename generated from the candidate's first and last name
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
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "502":
 *         description: The stored resume could not be loaded from the media provider
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
router.get("/profile/resume/view", viewCandidateResume);

/**
 * @openapi
 * /api/v1/candidates/profile:
 *   post:
 *     tags:
 *       - Candidates
 *     operationId: createCandidateProfile
 *     summary: Create the authenticated candidate profile
 *     description: |
 *       Creates the profile associated with the authenticated candidate
 *       account.
 *
 *       A candidate account can have only one profile.
 *
 *       Skills, target job titles, and preferred locations are
 *       normalized to lowercase and duplicate values are removed.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateCandidateProfileInput"
 *     responses:
 *       "201":
 *         description: Candidate profile created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateProfile"
 *             example:
 *               statusCode: 201
 *               success: true
 *               message: Candidate profile created successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439030
 *                 userId: 507f1f77bcf86cd799439011
 *                 firstName: Sahil
 *                 lastName: Pawar
 *                 phone: "+91 9876543210"
 *                 headline: MERN Stack Developer
 *                 summary: Full-stack developer focused on secure and maintainable web applications.
 *                 skills:
 *                   - javascript
 *                   - react
 *                   - node.js
 *                   - mongodb
 *                 experienceLevel: entry
 *                 location: Pune, Maharashtra
 *                 targetJobTitles:
 *                   - mern stack developer
 *                   - backend developer
 *                 preferredLocations:
 *                   - pune
 *                   - mumbai
 *                 preferredWorkplaceTypes:
 *                   - remote
 *                   - hybrid
 *                 preferredEmploymentTypes:
 *                   - full-time
 *                 resumeUrl: null
 *                 resumePublicId: null
 *                 linkedinUrl: https://www.linkedin.com/in/example
 *                 githubUrl: https://github.com/example
 *                 portfolioUrl: https://example.dev
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
 *     operationId: getMyCandidateProfile
 *     summary: Get the authenticated candidate profile
 *     description: |
 *       Returns the current candidate profile together with a summary
 *       of the associated authentication account.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Candidate profile returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateProfileWithAccount"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Candidate profile fetched successfully
 *               data:
 *                 _id: 507f1f77bcf86cd799439030
 *                 userId:
 *                   _id: 507f1f77bcf86cd799439011
 *                   username: sahil_24
 *                   email: candidate@example.com
 *                   role: candidate
 *                   isEmailVerified: true
 *                 firstName: Sahil
 *                 lastName: Pawar
 *                 phone: "+91 9876543210"
 *                 headline: MERN Stack Developer
 *                 summary: Full-stack developer focused on secure and maintainable web applications.
 *                 skills:
 *                   - javascript
 *                   - react
 *                   - node.js
 *                   - mongodb
 *                 experienceLevel: entry
 *                 location: Pune, Maharashtra
 *                 targetJobTitles:
 *                   - mern stack developer
 *                   - backend developer
 *                 preferredLocations:
 *                   - pune
 *                   - mumbai
 *                 preferredWorkplaceTypes:
 *                   - remote
 *                   - hybrid
 *                 preferredEmploymentTypes:
 *                   - full-time
 *                 resumeUrl: null
 *                 resumePublicId: null
 *                 linkedinUrl: https://www.linkedin.com/in/example
 *                 githubUrl: https://github.com/example
 *                 portfolioUrl: https://example.dev
 *                 createdAt: "2026-08-01T10:00:00.000Z"
 *                 updatedAt: "2026-08-01T10:00:00.000Z"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/profile", getMyCandidateProfile);

/**
 * @openapi
 * /api/v1/candidates/profile:
 *   patch:
 *     tags:
 *       - Candidates
 *     operationId: updateCandidateProfile
 *     summary: Update the authenticated candidate profile
 *     description: |
 *       Updates one or more fields on the authenticated candidate's
 *       existing profile.
 *
 *       Skills, target job titles, and preferred locations are
 *       normalized to lowercase and duplicate values are removed.
 *
 *       Resume fields cannot be updated through this endpoint. Use the
 *       dedicated resume-upload endpoint.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateCandidateProfileInput"
 *     responses:
 *       "200":
 *         description: Candidate profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateProfile"
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
  "/profile",
  validate(updateCandidateProfileSchema),
  updateCandidateProfile,
);

/**
 * @openapi
 * /api/v1/candidates/profile/resume:
 *   patch:
 *     tags:
 *       - Candidates
 *       - Uploads
 *     operationId: uploadCandidateResume
 *     summary: Upload or replace the candidate resume
 *     description: |
 *       Uploads one PDF resume with a maximum size of 5 MB.
 *
 *       The candidate must create a profile before uploading a resume.
 *       A successful request replaces the resume URL stored on the
 *       candidate profile.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: PDF file up to 5 MB
 *     responses:
 *       "200":
 *         description: Candidate resume uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CandidateProfile"
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
router.patch("/profile/resume", uploadResume, uploadCandidateResume);

export default router;
