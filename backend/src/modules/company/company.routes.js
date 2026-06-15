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
  getPublicCompany,
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
  uploadCompanyLogo,
} from "./company.controller.js";

const router = express.Router();

router.get("/public", getPublicCompany);

router.post(
  "/",
  authenticate,
  authorize(ROLES.OWNER),
  validate(createCompanySchema),
  createCompany,
);

router.patch(
  "/",
  authenticate,
  authorize(ROLES.OWNER),
  validate(updateCompanySchema),
  updateCompany,
);

router.post(
  "/recruiters",
  authenticate,
  authorize(ROLES.OWNER),
  validate(createRecruiterSchema),
  createRecruiter,
);

router.get("/recruiters", authenticate, authorize(ROLES.OWNER), listRecruiters);

router.patch(
  "/recruiters/:recruiterId/status",
  authenticate,
  authorize(ROLES.OWNER),
  validate(updateRecruiterStatusSchema),
  updateRecruiterStatus,
);

router.patch(
  "/logo",
  authenticate,
  authorize(ROLES.OWNER),
  uploadCompanyLogoFile,
  uploadCompanyLogo,
);

export default router;
