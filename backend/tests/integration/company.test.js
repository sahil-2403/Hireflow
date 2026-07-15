import { vi } from "vitest";

vi.mock("../../src/shared/services/media.service.js", () => ({
  uploadLogoFile: vi.fn().mockResolvedValue({
    url: "https://example.com/company-logo.png",
    publicId: "hireflow/company-logos/test-logo",
    resourceType: "image",
  }),
  uploadResumeFile: vi.fn(),
  uploadProfilePhotoFile: vi.fn(),
  deleteAsset: vi.fn().mockResolvedValue(undefined),
}));

import request from "supertest";

import app from "../../src/app.js";

import Company from "../../src/modules/company/company.model.js";
import CompanyOwner from "../../src/modules/companyOwner/companyOwner.model.js";
import Recruiter from "../../src/modules/recruiter/recruiter.model.js";
import User from "../../src/modules/auth/auth.model.js";

import { ROLES, COMPANY_SIZE } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
  patchWithCsrf,
  deleteWithCsrf,
  getCsrfToken,
  csrfHeader,
} from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createRecruiterProfile,
} from "../helpers/business.helpers.js";

import {
  uploadLogoFile,
  deleteAsset,
} from "../../src/shared/services/media.service.js";

const createOwnerData = (suffix) => ({
  username: `co_owner_${suffix}`,
  email: `co.owner.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.OWNER,
});

const createCandidateData = (suffix) => ({
  username: `co_cand_${suffix}`,
  email: `co.cand.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.CANDIDATE,
});

const buildCompanyPayload = (overrides = {}) => ({
  name: "HireFlow Technologies",
  industry: "Software Development",
  companySize: COMPANY_SIZE.ELEVEN_TO_FIFTY,
  websiteUrl: "https://hireflow.example.com",
  description: "A company profile created during integration tests.",
  headquarters: "Pune, Maharashtra",
  ...overrides,
});

const buildRecruiterPayload = (suffix = "one", overrides = {}) => ({
  username: `co_rec_${suffix}`,
  email: `co.rec.${suffix}@example.com`,
  password: "Password123",
  firstName: "Test",
  lastName: "Recruiter",
  jobTitle: "Technical Recruiter",
  ...overrides,
});

const setupOwner = async (suffix = "base") => {
  const ownerData = createOwnerData(suffix);

  const owner = await createVerifiedUser(ownerData);

  const ownerSession = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  return {
    ownerData,
    owner,
    ownerSession,
  };
};

const setupOwnerWithCompany = async (suffix = "base") => {
  const setup = await setupOwner(suffix);

  const company = await createCompanyForOwner(setup.owner._id);

  return {
    ...setup,
    company,
  };
};

const setupRecruiterWithCompany = async (suffix = "base") => {
  const ownerSetup = await setupOwnerWithCompany(`ro_${suffix}`);

  const recruiterData = {
    username: `co_rec_user_${suffix}`,
    email: `co.rec.user.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.RECRUITER,
  };

  const recruiterUser = await createVerifiedUser(recruiterData);

  const recruiterProfile = await createRecruiterProfile({
    userId: recruiterUser._id,
    companyId: ownerSetup.company._id,
    createdBy: ownerSetup.owner._id,
  });

  const recruiterSession = await loginUser({
    email: recruiterData.email,
    password: recruiterData.password,
  });

  return {
    ...ownerSetup,
    recruiterData,
    recruiterUser,
    recruiterProfile,
    recruiterSession,
  };
};

describe("Company profile and recruiter management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    uploadLogoFile.mockResolvedValue({
      url: "https://example.com/company-logo.png",
      publicId: "hireflow/company-logos/test-logo",
      resourceType: "image",
    });

    deleteAsset.mockResolvedValue(undefined);
  });

  test("company admin can create a company profile", async () => {
    const { owner, ownerSession } = await setupOwner("create");

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company",
      buildCompanyPayload(),
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Company profile created successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        ownerId: owner._id.toString(),
        name: "HireFlow Technologies",
        industry: "Software Development",
        companySize: COMPANY_SIZE.ELEVEN_TO_FIFTY,
        websiteUrl: "https://hireflow.example.com",
        headquarters: "Pune, Maharashtra",
      }),
    );

    const company = await Company.findOne({
      ownerId: owner._id,
    });

    expect(company).not.toBeNull();
    expect(company.name).toBe("HireFlow Technologies");
  });

  test("company admin cannot create duplicate company profile", async () => {
    const { owner, ownerSession } = await setupOwnerWithCompany("dupe");

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company",
      buildCompanyPayload({
        name: "Duplicate Company",
      }),
      409,
    );

    expect(response.body.message).toBe(
      "A company profile already exists for this account",
    );

    expect(
      await Company.countDocuments({
        ownerId: owner._id,
      }),
    ).toBe(1);
  });

  test("company profile create rejects invalid payload", async () => {
    const { ownerSession } = await setupOwner("invalid");

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company",
      {
        name: "A",
        industry: "",
        companySize: "invalid-size",
        websiteUrl: "not-a-url",
        headquarters: "",
      },
      400,
    );

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(await Company.countDocuments()).toBe(0);
  });

  test("company admin can fetch own company profile", async () => {
    const { company, ownerSession } = await setupOwnerWithCompany("fetch");

    const response = await ownerSession.agent
      .get("/api/v1/company")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Company profile fetched successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        name: "HireFlow Test Company",
        industry: "Software Development",
        headquarters: "Pune, Maharashtra",
      }),
    );
  });

  test("recruiter can fetch assigned company profile", async () => {
    const { company, recruiterSession } =
      await setupRecruiterWithCompany("fetch");

    const response = await recruiterSession.agent
      .get("/api/v1/company")
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        name: "HireFlow Test Company",
      }),
    );
  });

  test("company fetch returns 404 when company profile does not exist", async () => {
    const { ownerSession } = await setupOwner("missing");

    const response = await ownerSession.agent
      .get("/api/v1/company")
      .expect(404);

    expect(response.body.message).toBe("Company profile not found");
  });

  test("company admin can update company profile", async () => {
    const { company, ownerSession } = await setupOwnerWithCompany("update");

    const response = await patchWithCsrf(
      ownerSession.agent,
      "/api/v1/company",
      {
        name: "Updated HireFlow",
        websiteUrl: "",
        description: "",
        headquarters: "Mumbai, Maharashtra",
      },
      200,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Company profile updated successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        name: "Updated HireFlow",
        websiteUrl: null,
        description: null,
        headquarters: "Mumbai, Maharashtra",
      }),
    );

    const savedCompany = await Company.findById(company._id);

    expect(savedCompany.name).toBe("Updated HireFlow");
    expect(savedCompany.websiteUrl).toBeNull();
    expect(savedCompany.description).toBeNull();
  });

  test("company update rejects empty body", async () => {
    const { ownerSession } = await setupOwnerWithCompany("emptyupd");

    const response = await patchWithCsrf(
      ownerSession.agent,
      "/api/v1/company",
      {},
      400,
    );

    expect(response.body.message).toBe("Validation failed");
  });

  test("candidate cannot access company profile routes", async () => {
    const candidateData = createCandidateData("blocked");

    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await candidateSession.agent
      .get("/api/v1/company")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("guest cannot access company profile routes", async () => {
    const response = await request(app).get("/api/v1/company").expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("company admin can create recruiter account", async () => {
    const { company, owner, ownerSession } =
      await setupOwnerWithCompany("createrec");

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("create"),
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recruiter created successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        username: "co_rec_create",
        email: "co.rec.create@example.com",
        firstName: "Test",
        lastName: "Recruiter",
        jobTitle: "Technical Recruiter",
        isActive: true,
      }),
    );

    const recruiterUser = await User.findOne({
      email: "co.rec.create@example.com",
    });

    expect(recruiterUser).not.toBeNull();
    expect(recruiterUser.role).toBe(ROLES.RECRUITER);
    expect(recruiterUser.isEmailVerified).toBe(true);

    const recruiterProfile = await Recruiter.findOne({
      userId: recruiterUser._id,
    });

    expect(recruiterProfile.companyId.toString()).toBe(company._id.toString());
    expect(recruiterProfile.createdBy.toString()).toBe(owner._id.toString());
  });

  test("recruiter creation rejects duplicate email", async () => {
    const { ownerSession } = await setupOwnerWithCompany("dupeemail");

    await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("dupeemail"),
      201,
    );

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("dupeemailtwo", {
        email: "co.rec.dupeemail@example.com",
      }),
      409,
    );

    expect(response.body.message).toBe("Email already exists");
  });

  test("recruiter creation rejects duplicate username", async () => {
    const { ownerSession } = await setupOwnerWithCompany("dupeuser");

    await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("dupeuser"),
      201,
    );

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("different", {
        username: "co_rec_dupeuser",
      }),
      409,
    );

    expect(response.body.message).toBe("Username already exists");
  });

  test("recruiter creation rejects invalid payload", async () => {
    const { ownerSession } = await setupOwnerWithCompany("badrec");

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      {
        username: "bad user",
        email: "not-email",
        password: "weak",
        firstName: "",
        lastName: "",
        jobTitle: "",
      },
      400,
    );

    expect(response.body.message).toBe("Validation failed");
  });

  test("company admin can list company recruiters", async () => {
    const { ownerSession } = await setupOwnerWithCompany("listrec");

    await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("listone"),
      201,
    );

    await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("listtwo"),
      201,
    );

    const response = await ownerSession.agent
      .get("/api/v1/company/recruiters")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recruiters fetched successfully");

    expect(response.body.data).toHaveLength(2);

    expect(response.body.data[0].userId).toEqual(
      expect.objectContaining({
        username: expect.any(String),
        email: expect.any(String),
        role: ROLES.RECRUITER,
      }),
    );
  });

  test("company admin can deactivate and reactivate recruiter", async () => {
    const { ownerSession } = await setupOwnerWithCompany("status");

    const created = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("status"),
      201,
    );

    const recruiterId = created.body.data.id;

    const deactivateResponse = await patchWithCsrf(
      ownerSession.agent,
      `/api/v1/company/recruiters/${recruiterId}/status`,
      {
        isActive: false,
      },
      200,
    );

    expect(deactivateResponse.body.message).toBe(
      "Recruiter deactivated successfully",
    );

    expect(deactivateResponse.body.data.isActive).toBe(false);
    expect(deactivateResponse.body.data.userId.isActive).toBe(false);

    const recruiterAfterDeactivate = await Recruiter.findById(recruiterId);
    const userAfterDeactivate = await User.findById(
      recruiterAfterDeactivate.userId,
    );

    expect(recruiterAfterDeactivate.isActive).toBe(false);
    expect(userAfterDeactivate.isActive).toBe(false);

    const reactivateResponse = await patchWithCsrf(
      ownerSession.agent,
      `/api/v1/company/recruiters/${recruiterId}/status`,
      {
        isActive: true,
      },
      200,
    );

    expect(reactivateResponse.body.message).toBe(
      "Recruiter activated successfully",
    );

    expect(reactivateResponse.body.data.isActive).toBe(true);
    expect(reactivateResponse.body.data.userId.isActive).toBe(true);
  });

  test("company admin cannot update another company's recruiter", async () => {
    const firstSetup = await setupOwnerWithCompany("firstco");
    const secondSetup = await setupOwnerWithCompany("secondco");

    const secondRecruiter = await postWithCsrf(
      secondSetup.ownerSession.agent,
      "/api/v1/company/recruiters",
      buildRecruiterPayload("secondco"),
      201,
    );

    const response = await patchWithCsrf(
      firstSetup.ownerSession.agent,
      `/api/v1/company/recruiters/${secondRecruiter.body.data.id}/status`,
      {
        isActive: false,
      },
      404,
    );

    expect(response.body.message).toBe("Recruiter not found");
  });

  test("recruiter cannot manage company recruiters", async () => {
    const { recruiterSession } = await setupRecruiterWithCompany("blocked");

    const response = await recruiterSession.agent
      .get("/api/v1/company/recruiters")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("company admin can upload and delete company logo", async () => {
    const { company, ownerSession } = await setupOwnerWithCompany("logo");

    const csrfToken = await getCsrfToken(ownerSession.agent);

    const uploadResponse = await ownerSession.agent
      .patch("/api/v1/company/logo")
      .set(csrfHeader(csrfToken))
      .attach("logo", Buffer.from("fake image"), {
        filename: "logo.png",
        contentType: "image/png",
      })
      .expect(200);

    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.message).toBe(
      "Company logo uploaded successfully",
    );

    expect(uploadResponse.body.data).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        logoUrl: "https://example.com/company-logo.png",
        logoPublicId: "hireflow/company-logos/test-logo",
      }),
    );

    expect(uploadLogoFile).toHaveBeenCalledTimes(1);

    const deleteResponse = await deleteWithCsrf(
      ownerSession.agent,
      "/api/v1/company/logo",
      200,
    );

    expect(deleteResponse.body.message).toBe(
      "Company logo removed successfully",
    );
    expect(deleteResponse.body.data.logoUrl).toBeNull();
    expect(deleteResponse.body.data.logoPublicId).toBeNull();

    expect(deleteAsset).toHaveBeenCalledWith(
      "hireflow/company-logos/test-logo",
      "image",
    );
  });

  test("company logo upload rejects missing file", async () => {
    const { ownerSession } = await setupOwnerWithCompany("logomissing");

    const csrfToken = await getCsrfToken(ownerSession.agent);

    const response = await ownerSession.agent
      .patch("/api/v1/company/logo")
      .set(csrfHeader(csrfToken))
      .expect(400);

    expect(response.body.message).toBe("Company logo file is required");
    expect(uploadLogoFile).not.toHaveBeenCalled();
  });

  test("company logo upload rejects unsupported file type", async () => {
    const { ownerSession } = await setupOwnerWithCompany("logobad");

    const csrfToken = await getCsrfToken(ownerSession.agent);

    const response = await ownerSession.agent
      .patch("/api/v1/company/logo")
      .set(csrfHeader(csrfToken))
      .attach("logo", Buffer.from("not image"), {
        filename: "logo.txt",
        contentType: "text/plain",
      })
      .expect(400);

    expect(response.body.message).toBe("Unsupported file type: text/plain");
    expect(uploadLogoFile).not.toHaveBeenCalled();
  });

  test("company admin can save and fetch own company member profile", async () => {
    const { owner, company, ownerSession } =
      await setupOwnerWithCompany("memberowner");

    const updateResponse = await patchWithCsrf(
      ownerSession.agent,
      "/api/v1/company/members/me",
      {
        firstName: "Sahil",
        lastName: "Pawar",
        phone: "",
        jobTitle: "Founder",
      },
      200,
    );

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toBe(
      "Company owner profile saved successfully",
    );

    expect(updateResponse.body.data).toEqual(
      expect.objectContaining({
        account: expect.objectContaining({
          id: owner._id.toString(),
          role: ROLES.OWNER,
        }),
        company: expect.objectContaining({
          id: company._id.toString(),
          name: "HireFlow Test Company",
        }),
        member: expect.objectContaining({
          memberRole: ROLES.OWNER,
          firstName: "Sahil",
          lastName: "Pawar",
          phone: null,
          jobTitle: "Founder",
          isActive: true,
        }),
      }),
    );

    const ownerProfile = await CompanyOwner.findOne({
      userId: owner._id,
      companyId: company._id,
    });

    expect(ownerProfile).not.toBeNull();

    const getResponse = await ownerSession.agent
      .get("/api/v1/company/members/me")
      .expect(200);

    expect(getResponse.body.message).toBe(
      "Company member profile fetched successfully",
    );

    expect(getResponse.body.data.member).toEqual(
      expect.objectContaining({
        firstName: "Sahil",
        lastName: "Pawar",
        jobTitle: "Founder",
      }),
    );
  });

  test("recruiter can fetch and update own company member profile", async () => {
    const { recruiterUser, recruiterProfile, recruiterSession } =
      await setupRecruiterWithCompany("memberrec");

    const getResponse = await recruiterSession.agent
      .get("/api/v1/company/members/me")
      .expect(200);

    expect(getResponse.body.data).toEqual(
      expect.objectContaining({
        account: expect.objectContaining({
          id: recruiterUser._id.toString(),
          role: ROLES.RECRUITER,
        }),
        member: expect.objectContaining({
          id: recruiterProfile._id.toString(),
          memberRole: ROLES.RECRUITER,
          firstName: "Test",
          lastName: "Recruiter",
          isActive: true,
        }),
      }),
    );

    const updateResponse = await patchWithCsrf(
      recruiterSession.agent,
      "/api/v1/company/members/me",
      {
        firstName: "Updated",
        lastName: "Recruiter",
        phone: "9999999999",
        jobTitle: "Senior Technical Recruiter",
      },
      200,
    );

    expect(updateResponse.body.message).toBe(
      "Recruiter profile updated successfully",
    );

    expect(updateResponse.body.data.member).toEqual(
      expect.objectContaining({
        firstName: "Updated",
        phone: "9999999999",
        jobTitle: "Senior Technical Recruiter",
      }),
    );
  });

  test("inactive recruiter cannot fetch company member profile", async () => {
    const { recruiterUser, recruiterSession } =
      await setupRecruiterWithCompany("inactive");

    await Recruiter.findOneAndUpdate(
      {
        userId: recruiterUser._id,
      },
      {
        isActive: false,
      },
    );

    const response = await recruiterSession.agent
      .get("/api/v1/company/members/me")
      .expect(403);

    expect(response.body.message).toBe("Active recruiter profile not found");
  });
});
