import { vi } from "vitest";

vi.mock("../../src/shared/services/media.service.js", () => ({
  uploadResumeFile: vi.fn().mockResolvedValue({
    url: "https://example.com/uploaded-resume.pdf",
    publicId: "hireflow/resumes/test-resume",
    resourceType: "raw",
  }),
  deleteAsset: vi.fn().mockResolvedValue(undefined),
  uploadLogoFile: vi.fn(),
  uploadProfilePhotoFile: vi.fn(),
}));

import request from "supertest";

import app from "../../src/app.js";

import Candidate from "../../src/modules/candidate/candidate.model.js";

import {
  ROLES,
  EXPERIENCE_LEVEL,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
} from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
  patchWithCsrf,
  getCsrfToken,
  csrfHeader,
} from "../helpers/auth.helpers.js";

import { createCandidateProfile } from "../helpers/business.helpers.js";

import {
  uploadResumeFile,
  deleteAsset,
} from "../../src/shared/services/media.service.js";

const createCandidateData = (suffix) => ({
  username: `cand_${suffix}`,
  email: `cand.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.CANDIDATE,
});

const createOwnerData = (suffix) => ({
  username: `cand_owner_${suffix}`,
  email: `cand.owner.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.OWNER,
});

const buildProfilePayload = (overrides = {}) => ({
  firstName: "Sahil",
  lastName: "Pawar",
  phone: "9876543210",
  headline: "Junior MERN Developer",
  summary:
    "I build full-stack applications using MongoDB, Express, React, and Node.js.",
  skills: ["JavaScript", "React", "Node.js", "React"],
  experienceLevel: EXPERIENCE_LEVEL.ENTRY,
  location: "Pune, Maharashtra",
  targetJobTitles: ["MERN Developer", "React Developer", "MERN Developer"],
  preferredLocations: ["Pune", "Remote", "Pune"],
  preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
  preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
  linkedinUrl: "https://linkedin.com/in/sahil-test",
  githubUrl: "https://github.com/sahil-test",
  portfolioUrl: "https://portfolio.example.com",
  ...overrides,
});

const setupCandidate = async (suffix = "base") => {
  const candidateData = createCandidateData(suffix);

  const candidateUser = await createVerifiedUser(candidateData);

  const candidateSession = await loginUser({
    email: candidateData.email,
    password: candidateData.password,
  });

  return {
    candidateData,
    candidateUser,
    candidateSession,
  };
};

describe("Candidate profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    uploadResumeFile.mockResolvedValue({
      url: "https://example.com/uploaded-resume.pdf",
      publicId: "hireflow/resumes/test-resume",
      resourceType: "raw",
    });

    deleteAsset.mockResolvedValue(undefined);
  });

  test("candidate can create a profile", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("create");

    const response = await postWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      buildProfilePayload(),
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Candidate profile created successfully",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        userId: candidateUser._id.toString(),
        firstName: "Sahil",
        lastName: "Pawar",
        headline: "Junior MERN Developer",
        experienceLevel: EXPERIENCE_LEVEL.ENTRY,
        location: "Pune, Maharashtra",
        skills: ["javascript", "react", "node.js"],
        targetJobTitles: ["mern developer", "react developer"],
        preferredLocations: ["pune", "remote"],
        preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
        preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
      }),
    );

    const profile = await Candidate.findOne({
      userId: candidateUser._id,
    });

    expect(profile).not.toBeNull();
    expect(profile.skills).toEqual(["javascript", "react", "node.js"]);
  });

  test("candidate cannot create duplicate profile", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("dupe");

    await createCandidateProfile({
      userId: candidateUser._id,
    });

    const response = await postWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      buildProfilePayload(),
      409,
    );

    expect(response.body.message).toBe("Candidate profile already exists");

    expect(
      await Candidate.countDocuments({
        userId: candidateUser._id,
      }),
    ).toBe(1);
  });

  test("candidate profile create rejects invalid payload", async () => {
    const { candidateSession } = await setupCandidate("invalid");

    const response = await postWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      {
        firstName: "",
        lastName: "",
        experienceLevel: "invalid-level",
        location: "",
        linkedinUrl: "not-a-url",
      },
      400,
    );

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    expect(await Candidate.countDocuments()).toBe(0);
  });

  test("candidate can fetch own profile with user details populated", async () => {
    const { candidateUser, candidateData, candidateSession } =
      await setupCandidate("fetch");

    const profile = await createCandidateProfile({
      userId: candidateUser._id,
    });

    const response = await candidateSession.agent
      .get("/api/v1/candidates/profile")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Candidate profile fetched successfully",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: profile._id.toString(),
        firstName: "Test",
        lastName: "Candidate",
      }),
    );

    expect(response.body.data.userId).toEqual(
      expect.objectContaining({
        _id: candidateUser._id.toString(),
        email: candidateData.email,
        role: ROLES.CANDIDATE,
        isEmailVerified: true,
      }),
    );
  });

  test("fetch profile returns 404 when candidate profile does not exist", async () => {
    const { candidateSession } = await setupCandidate("missing");

    const response = await candidateSession.agent
      .get("/api/v1/candidates/profile")
      .expect(404);

    expect(response.body.message).toBe("Candidate profile not found");
  });

  test("candidate can update own profile", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("update");

    await createCandidateProfile({
      userId: candidateUser._id,
    });

    const response = await patchWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      {
        headline: "Updated MERN Developer",
        summary: "",
        skills: ["Express", "MongoDB", "Express"],
        preferredLocations: ["Mumbai", "Remote", "Mumbai"],
        linkedinUrl: "",
      },
      200,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Candidate profile updated successfully",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        headline: "Updated MERN Developer",
        summary: null,
        skills: ["express", "mongodb"],
        preferredLocations: ["mumbai", "remote"],
        linkedinUrl: null,
      }),
    );

    const profile = await Candidate.findOne({
      userId: candidateUser._id,
    });

    expect(profile.headline).toBe("Updated MERN Developer");
    expect(profile.summary).toBeNull();
    expect(profile.skills).toEqual(["express", "mongodb"]);
  });

  test("candidate profile update rejects empty body", async () => {
    const { candidateUser, candidateSession } =
      await setupCandidate("emptyupd");

    await createCandidateProfile({
      userId: candidateUser._id,
    });

    const response = await patchWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      {},
      400,
    );

    expect(response.body.message).toBe("Validation failed");
  });

  test("candidate profile update returns 404 when profile does not exist", async () => {
    const { candidateSession } = await setupCandidate("updmissing");

    const response = await patchWithCsrf(
      candidateSession.agent,
      "/api/v1/candidates/profile",
      {
        headline: "New headline",
      },
      404,
    );

    expect(response.body.message).toBe("Candidate profile not found");
  });

  test("company admin cannot access candidate profile routes", async () => {
    const ownerData = createOwnerData("blocked");

    await createVerifiedUser(ownerData);

    const ownerSession = await loginUser({
      email: ownerData.email,
      password: ownerData.password,
    });

    const response = await ownerSession.agent
      .get("/api/v1/candidates/profile")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("guest cannot access candidate profile routes", async () => {
    const response = await request(app)
      .get("/api/v1/candidates/profile")
      .expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("candidate can upload resume", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("upload");

    await createCandidateProfile({
      userId: candidateUser._id,
      resumeUrl: null,
    });

    const csrfToken = await getCsrfToken(candidateSession.agent);

    const response = await candidateSession.agent
      .patch("/api/v1/candidates/profile/resume")
      .set(csrfHeader(csrfToken))
      .attach("resume", Buffer.from("%PDF-1.4 test resume"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Resume uploaded successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        resumeUrl: "https://example.com/uploaded-resume.pdf",
        resumePublicId: "hireflow/resumes/test-resume",
      }),
    );

    expect(uploadResumeFile).toHaveBeenCalledTimes(1);

    const profile = await Candidate.findOne({
      userId: candidateUser._id,
    });

    expect(profile.resumeUrl).toBe("https://example.com/uploaded-resume.pdf");
    expect(profile.resumePublicId).toBe("hireflow/resumes/test-resume");
  });

  test("resume upload rejects missing file", async () => {
    const { candidateUser, candidateSession } =
      await setupCandidate("missingfile");

    await createCandidateProfile({
      userId: candidateUser._id,
    });

    const csrfToken = await getCsrfToken(candidateSession.agent);

    const response = await candidateSession.agent
      .patch("/api/v1/candidates/profile/resume")
      .set(csrfHeader(csrfToken))
      .expect(400);

    expect(response.body.message).toBe("Resume file is required");
    expect(uploadResumeFile).not.toHaveBeenCalled();
  });

  test("resume upload rejects unsupported file type", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("badtype");

    await createCandidateProfile({
      userId: candidateUser._id,
    });

    const csrfToken = await getCsrfToken(candidateSession.agent);

    const response = await candidateSession.agent
      .patch("/api/v1/candidates/profile/resume")
      .set(csrfHeader(csrfToken))
      .attach("resume", Buffer.from("not a pdf"), {
        filename: "resume.txt",
        contentType: "text/plain",
      })
      .expect(400);

    expect(response.body.message).toBe("Unsupported file type: text/plain");
    expect(uploadResumeFile).not.toHaveBeenCalled();
  });

  test("resume upload returns 404 when profile does not exist", async () => {
    const { candidateSession } = await setupCandidate("uploadmissing");

    const csrfToken = await getCsrfToken(candidateSession.agent);

    const response = await candidateSession.agent
      .patch("/api/v1/candidates/profile/resume")
      .set(csrfHeader(csrfToken))
      .attach("resume", Buffer.from("%PDF-1.4 test resume"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      })
      .expect(404);

    expect(response.body.message).toBe("Candidate profile not found");
    expect(uploadResumeFile).not.toHaveBeenCalled();
  });

  test("candidate can view own resume as PDF", async () => {
    const { candidateUser, candidateSession } = await setupCandidate("viewres");

    await createCandidateProfile({
      userId: candidateUser._id,
      resumeUrl: "https://example.com/view-resume.pdf",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("%PDF-1.4 candidate resume"),
    });

    const response = await candidateSession.agent
      .get("/api/v1/candidates/profile/resume/view")
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      "Test-Candidate-resume.pdf",
    );
  });

  test("view resume returns 404 when resume is missing", async () => {
    const { candidateUser, candidateSession } =
      await setupCandidate("viewmissing");

    await createCandidateProfile({
      userId: candidateUser._id,
      resumeUrl: null,
    });

    const response = await candidateSession.agent
      .get("/api/v1/candidates/profile/resume/view")
      .expect(404);

    expect(response.body.message).toBe("Resume not found");
  });
});
