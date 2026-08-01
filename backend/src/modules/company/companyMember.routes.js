import express from "express";

import authenticate from "../../shared/middleware/authenticate.js";
import authorize from "../../shared/middleware/authorize.js";
import validate from "../../shared/middleware/validate.js";

import { ROLES } from "../../config/constants.js";

import { updateCompanyMemberProfileSchema } from "./companyMember.validation.js";

import {
  getMyCompanyMemberProfile,
  updateMyCompanyMemberProfile,
} from "./companyMember.controller.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CompanyMemberAccount:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - email
 *         - role
 *         - profilePhotoUrl
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         username:
 *           type: string
 *           example: company_admin
 *         email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         role:
 *           type: string
 *           enum:
 *             - owner
 *             - recruiter
 *           example: owner
 *         profilePhotoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://res.cloudinary.com/example/image/upload/profile.jpg
 *
 *     CompanyMemberCompany:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - logoUrl
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
 *           example: https://res.cloudinary.com/example/image/upload/company-logo.png
 *
 *     CompanyMemberDetails:
 *       type: object
 *       required:
 *         - id
 *         - memberRole
 *         - firstName
 *         - lastName
 *         - phone
 *         - jobTitle
 *         - isActive
 *       properties:
 *         id:
 *           $ref: "#/components/schemas/ObjectId"
 *         memberRole:
 *           type: string
 *           enum:
 *             - owner
 *             - recruiter
 *           example: owner
 *         firstName:
 *           type: string
 *           example: Sahil
 *         lastName:
 *           type: string
 *           example: Pawar
 *         phone:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "+91 9876543210"
 *         jobTitle:
 *           type: string
 *           example: Company Administrator
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     CompanyMemberProfile:
 *       type: object
 *       required:
 *         - account
 *         - company
 *         - member
 *       properties:
 *         account:
 *           $ref: "#/components/schemas/CompanyMemberAccount"
 *         company:
 *           $ref: "#/components/schemas/CompanyMemberCompany"
 *         member:
 *           $ref: "#/components/schemas/CompanyMemberDetails"
 *
 *     UpdateCompanyMemberProfileInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - jobTitle
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
 *         jobTitle:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Company Administrator
 */

router.use(authenticate, authorize(ROLES.OWNER, ROLES.RECRUITER));

/**
 * @openapi
 * /api/v1/company/members/me:
 *   get:
 *     tags:
 *       - Company Members
 *     operationId: getMyCompanyMemberProfile
 *     summary: Get the current company-member profile
 *     description: |
 *       Returns a unified company-member profile for either a company
 *       administrator or an active recruiter.
 *
 *       The response contains:
 *
 *       - Authentication-account identity
 *       - Company summary
 *       - Owner or recruiter profile information
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Company-member profile returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CompanyMemberProfile"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Company member profile fetched successfully
 *               data:
 *                 account:
 *                   id: 507f1f77bcf86cd799439011
 *                   username: company_admin
 *                   email: admin@example.com
 *                   role: owner
 *                   profilePhotoUrl: null
 *                 company:
 *                   id: 507f1f77bcf86cd799439012
 *                   name: Hireflow Technologies
 *                   logoUrl: null
 *                 member:
 *                   id: 507f1f77bcf86cd799439013
 *                   memberRole: owner
 *                   firstName: Sahil
 *                   lastName: Pawar
 *                   phone: "+91 9876543210"
 *                   jobTitle: Company Administrator
 *                   isActive: true
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/me", getMyCompanyMemberProfile);

/**
 * @openapi
 * /api/v1/company/members/me:
 *   patch:
 *     tags:
 *       - Company Members
 *     operationId: updateMyCompanyMemberProfile
 *     summary: Update the current company-member profile
 *     description: |
 *       Updates the personal company-member profile for the
 *       authenticated company administrator or active recruiter.
 *
 *       Company administrators and recruiters use the same request
 *       fields, but the information is stored in their respective
 *       profile models.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateCompanyMemberProfileInput"
 *     responses:
 *       "200":
 *         description: Company-member profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CompanyMemberProfile"
 *             example:
 *               statusCode: 200
 *               success: true
 *               message: Company owner profile saved successfully
 *               data:
 *                 account:
 *                   id: 507f1f77bcf86cd799439011
 *                   username: company_admin
 *                   email: admin@example.com
 *                   role: owner
 *                   profilePhotoUrl: null
 *                 company:
 *                   id: 507f1f77bcf86cd799439012
 *                   name: Hireflow Technologies
 *                   logoUrl: null
 *                 member:
 *                   id: 507f1f77bcf86cd799439013
 *                   memberRole: owner
 *                   firstName: Sahil
 *                   lastName: Pawar
 *                   phone: "+91 9876543210"
 *                   jobTitle: Company Administrator
 *                   isActive: true
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
  "/me",
  validate(updateCompanyMemberProfileSchema),
  updateMyCompanyMemberProfile,
);

export default router;
