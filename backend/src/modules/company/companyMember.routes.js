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

router.use(authenticate, authorize(ROLES.OWNER, ROLES.RECRUITER));

router.get("/me", getMyCompanyMemberProfile);

router.patch(
  "/me",
  validate(updateCompanyMemberProfileSchema),
  updateMyCompanyMemberProfile,
);

export default router;
