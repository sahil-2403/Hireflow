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
  updateApplicationStatus,
} from "./application.controller.js";

const router = express.Router();

router.post(
  "/jobs/:jobId/apply",
  authenticate,
  authorize(ROLES.CANDIDATE),
  validate(applyToJobSchema),
  applyToJob,
);

router.get("/me", authenticate, authorize(ROLES.CANDIDATE), listMyApplications);

router.get(
  "/manage",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedApplications,
);

router.patch(
  "/:applicationId/status",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

export default router;
