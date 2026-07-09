import CompanyOwner from "../companyOwner/companyOwner.model.js";
import Recruiter from "../recruiter/recruiter.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import { ROLES } from "../../config/constants.js";

import { getOwnerCompany } from "../../shared/utils/companyAccess.js";

const buildAccountSummary = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
  };
};

const buildCompanySummary = (company) => {
  return {
    id: company._id,
    name: company.name,
    logoUrl: company.logoUrl ?? null,
  };
};

const buildMemberSummary = (member, memberRole) => {
  return {
    id: member._id,
    memberRole,
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone ?? null,
    jobTitle: member.jobTitle,
    isActive: memberRole === ROLES.RECRUITER ? Boolean(member.isActive) : true,
  };
};

const buildCompanyMemberProfileResponse = ({
  user,
  company,
  member,
  memberRole,
}) => {
  return {
    account: buildAccountSummary(user),
    company: buildCompanySummary(company),
    member: buildMemberSummary(member, memberRole),
  };
};

const getRecruiterWithCompany = async (userId) => {
  const recruiter = await Recruiter.findOne({
    userId,
    isActive: true,
  })
    .populate({
      path: "companyId",
      select: "name logoUrl",
    })
    .lean();

  if (!recruiter) {
    throw new ApiError(403, "Active recruiter profile not found");
  }

  if (!recruiter.companyId) {
    throw new ApiError(404, "Company profile not found");
  }

  return recruiter;
};

const getMyCompanyMemberProfile = async (user) => {
  if (user.role === ROLES.OWNER) {
    const company = await getOwnerCompany(user.id);

    const companyOwner = await CompanyOwner.findOne({
      userId: user.id,
      companyId: company._id,
    }).lean();

    if (!companyOwner) {
      throw new ApiError(404, "Company owner profile not found");
    }

    return buildCompanyMemberProfileResponse({
      user,
      company,
      member: companyOwner,
      memberRole: ROLES.OWNER,
    });
  }

  if (user.role === ROLES.RECRUITER) {
    const recruiter = await getRecruiterWithCompany(user.id);

    return buildCompanyMemberProfileResponse({
      user,
      company: recruiter.companyId,
      member: recruiter,
      memberRole: ROLES.RECRUITER,
    });
  }

  throw new ApiError(403, "Only company members can access this profile");
};

const updateMyCompanyMemberProfile = async (user, profileData) => {
  if (user.role === ROLES.OWNER) {
    const company = await getOwnerCompany(user.id);

    const companyOwner = await CompanyOwner.findOneAndUpdate(
      {
        userId: user.id,
        companyId: company._id,
      },
      {
        $set: profileData,
        $setOnInsert: {
          userId: user.id,
          companyId: company._id,
        },
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return {
      profile: buildCompanyMemberProfileResponse({
        user,
        company,
        member: companyOwner,
        memberRole: ROLES.OWNER,
      }),
      message: "Company owner profile saved successfully",
    };
  }

  if (user.role === ROLES.RECRUITER) {
    const recruiter = await Recruiter.findOneAndUpdate(
      {
        userId: user.id,
        isActive: true,
      },
      {
        $set: profileData,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate({
        path: "companyId",
        select: "name logoUrl",
      })
      .lean();

    if (!recruiter) {
      throw new ApiError(403, "Active recruiter profile not found");
    }

    if (!recruiter.companyId) {
      throw new ApiError(404, "Company profile not found");
    }

    return {
      profile: buildCompanyMemberProfileResponse({
        user,
        company: recruiter.companyId,
        member: recruiter,
        memberRole: ROLES.RECRUITER,
      }),
      message: "Recruiter profile updated successfully",
    };
  }

  throw new ApiError(403, "Only company members can update this profile");
};

export { getMyCompanyMemberProfile, updateMyCompanyMemberProfile };
