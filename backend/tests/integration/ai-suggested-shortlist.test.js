import { vi } from "vitest";

vi.mock("../../src/modules/ai/aiProvider.service.js", async () => {
  const actual = await vi.importActual(
    "../../src/modules/ai/aiProvider.service.js",
  );

  return {
    ...actual,
    generateAiJson: vi.fn(),
  };
});

import Application from "../../src/modules/application/application.model.js";
import Candidate from "../../src/modules/candidate/candidate.model.js";
import Job from "../../src/modules/job/job.model.js";
import JobShortlist from "../../src/modules/jobShortlist/jobShortlist.model.js";

import {
  APPLICATION_STATUS,
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  ROLES,
  WORKPLACE_TYPE,
} from "../../src/config/constants.js";

import { createApplicationMatchSnapshot } from "../../src/modules/application/applicationMatch.service.js";

import { generateAiJson } from "../../src/modules/ai/aiProvider.service.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

import { createCompanyForOwner } from "../helpers/business.helpers.js";

const createOwnerCompanyAndSession = async (suffix) => {
  const ownerData = {
    username: `shortlist_owner_${suffix}`,
    email: `shortlist.owner.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.OWNER,
  };

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  const session = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  return {
    owner,
    company,
    session,
  };
};

const createShortlistJob = async ({ companyId, createdBy, suffix }) => {
  return Job.create({
    companyId,
    createdBy,
    title: `MERN Developer ${suffix}`,
    description:
      "Build production-ready MERN applications using React, Node.js, Express, and MongoDB.",
    responsibilities: ["Build frontend features", "Create REST APIs"],
    requirements: ["React", "Node.js", "MongoDB", "Express.js"],
    skills: ["React", "Node.js", "MongoDB", "Express.js"],
    location: "Pune",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 300000,
    salaryMax: 600000,
    salaryCurrency: "INR",
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  });
};

const createCandidateApplication = async ({ job, suffix, skills }) => {
  const userData = {
    username: `shortlist_candidate_${suffix}`,
    email: `shortlist.candidate.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const candidateUser = await createVerifiedUser(userData);

  const candidate = await Candidate.create({
    userId: candidateUser._id,
    firstName: "Candidate",
    lastName: suffix,
    headline: "Junior MERN Developer",
    summary: "Developer with practical web application experience.",
    skills,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune",
    targetJobTitles: ["MERN Developer"],
    preferredLocations: ["Pune"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: `https://example.com/resumes/${suffix}.pdf`,
    resumePublicId: `shortlist-resume-${suffix}`,
  });

  const application = await Application.create({
    jobId: job._id,
    candidateId: candidate._id,
    candidateUserId: candidateUser._id,
    companyId: job.companyId,
    coverLetter: "I am interested in this role.",
    resumeUrl: candidate.resumeUrl,
    status: APPLICATION_STATUS.APPLIED,
    statusHistory: [
      {
        status: APPLICATION_STATUS.APPLIED,
        changedBy: candidateUser._id,
      },
    ],
    matchSnapshot: createApplicationMatchSnapshot(job, candidate),
  });

  return {
    candidateUser,
    candidate,
    application,
  };
};

describe("AI Suggested Shortlist API", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_SHORTLIST_DAILY_LIMIT: process.env.AI_SHORTLIST_DAILY_LIMIT,
    AI_MAX_SHORTLIST_CANDIDATES: process.env.AI_MAX_SHORTLIST_CANDIDATES,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-test-model";
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.AI_SHORTLIST_DAILY_LIMIT = "3";
    process.env.AI_MAX_SHORTLIST_CANDIDATES = "10";

    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.AI_SHORTLIST_DAILY_LIMIT = originalEnv.AI_SHORTLIST_DAILY_LIMIT;
    process.env.AI_MAX_SHORTLIST_CANDIDATES =
      originalEnv.AI_MAX_SHORTLIST_CANDIDATES;
  });

  test("company admin can generate deterministic AI Suggested Shortlist", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("generate");

    const job = await createShortlistJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "generate",
    });

    const strong = await createCandidateApplication({
      job,
      suffix: "strong",
      skills: ["React", "Node.js", "MongoDB", "Express.js"],
    });

    const medium = await createCandidateApplication({
      job,
      suffix: "medium",
      skills: ["React", "Node.js"],
    });

    await createCandidateApplication({
      job,
      suffix: "weak",
      skills: ["Photoshop"],
    });

    generateAiJson.mockResolvedValue({
      candidates: [
        {
          applicationId: medium.application._id.toString(),
          summary: "Candidate has partial relevant experience.",
          strengths: ["React and Node.js overlap"],
          verificationPoints: ["Verify MongoDB knowledge"],
        },
        {
          applicationId: strong.application._id.toString(),
          summary: "Candidate has broad MERN skill coverage.",
          strengths: ["All listed job skills match"],
          verificationPoints: ["Verify project depth"],
        },
      ],
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 2,
      },
      201,
    );

    expect(response.body.message).toBe(
      "AI Suggested Shortlist generated successfully",
    );

    expect(response.body.data.reused).toBe(false);

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "shortlist",
        limit: 3,
        used: 1,
        remaining: 2,
      }),
    );

    const candidates = response.body.data.shortlist.candidates;

    expect(candidates).toHaveLength(2);

    expect(candidates[0].applicationId).toBe(strong.application._id.toString());

    expect(candidates[1].applicationId).toBe(medium.application._id.toString());

    expect(candidates[0].matchScore).toBeGreaterThan(candidates[1].matchScore);

    expect(generateAiJson).toHaveBeenCalledTimes(1);
    expect(await JobShortlist.countDocuments()).toBe(1);
  });

  test("same candidate set reuses cached suggested shortlist", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("reuse");

    const job = await createShortlistJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "reuse",
    });

    const candidateResult = await createCandidateApplication({
      job,
      suffix: "reuse",
      skills: ["React", "Node.js", "MongoDB", "Express.js"],
    });

    generateAiJson.mockResolvedValue({
      candidates: [
        {
          applicationId: candidateResult.application._id.toString(),
          summary: "Candidate matches the role.",
          strengths: ["Relevant MERN skills"],
          verificationPoints: ["Verify project depth"],
        },
      ],
    });

    await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 1,
      },
      201,
    );

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 1,
      },
      200,
    );

    expect(response.body.message).toBe(
      "AI Suggested Shortlist already available for this job",
    );

    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);
    expect(generateAiJson).toHaveBeenCalledTimes(1);
    expect(await JobShortlist.countDocuments()).toBe(1);
  });

  test("configured maximum shortlist size is enforced", async () => {
    process.env.AI_MAX_SHORTLIST_CANDIDATES = "2";

    const { owner, company, session } =
      await createOwnerCompanyAndSession("maximum");

    const job = await createShortlistJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "maximum",
    });

    const applications = [];

    for (let index = 1; index <= 3; index += 1) {
      const result = await createCandidateApplication({
        job,
        suffix: `maximum-${index}`,
        skills: ["React", "Node.js", "MongoDB", "Express.js"],
      });

      applications.push(result.application);
    }

    generateAiJson.mockResolvedValue({
      candidates: applications.map((application) => ({
        applicationId: application._id.toString(),
        summary: "Candidate matches the role.",
        strengths: ["Relevant skills"],
        verificationPoints: ["Verify experience"],
      })),
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 10,
      },
      201,
    );

    expect(response.body.data.shortlist.candidates).toHaveLength(2);

    expect(response.body.data.shortlist.totalEligibleCandidates).toBe(3);
  });

  test("company admin cannot generate shortlist for another company's job", async () => {
    const { owner, company } = await createOwnerCompanyAndSession("source");

    const { session: otherOwnerSession } =
      await createOwnerCompanyAndSession("other");

    const job = await createShortlistJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "other",
    });

    const response = await postWithCsrf(
      otherOwnerSession.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 5,
      },
      404,
    );

    expect(response.body.message).toBe("Job not found");
    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("job without eligible applications returns 400", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("empty");

    const job = await createShortlistJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "empty",
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/suggested-shortlist`,
      {
        limit: 5,
      },
      400,
    );

    expect(response.body.message).toBe(
      "No eligible applications found for this job",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
    expect(await JobShortlist.countDocuments()).toBe(0);
  });
});
