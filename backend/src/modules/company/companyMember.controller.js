import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/responses/ApiResponse.js";

import * as companyMemberService from "./companyMember.service.js";

const getMyCompanyMemberProfile = asyncHandler(async (req, res) => {
  const profile = await companyMemberService.getMyCompanyMemberProfile(
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Company member profile fetched successfully",
        profile,
      ),
    );
});

const updateMyCompanyMemberProfile = asyncHandler(async (req, res) => {
  const result = await companyMemberService.updateMyCompanyMemberProfile(
    req.user,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result.message, result.profile));
});

export { getMyCompanyMemberProfile, updateMyCompanyMemberProfile };
