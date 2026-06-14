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
} from "./job.controller.js";

const router = express.Router();

router.get("/", listPublicJobs);

router.get(
  "/manage",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  listManagedJobs,
);

router.post(
  "/",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(createJobSchema),
  createJob,
);

router.patch(
  "/:jobId",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateJobSchema),
  updateJob,
);

router.patch(
  "/:jobId/status",
  authenticate,
  authorize(ROLES.OWNER, ROLES.RECRUITER),
  validate(updateJobStatusSchema),
  updateJobStatus,
);

router.get("/:jobId", getPublicJobById);

export default router;
