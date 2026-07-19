import mongoose from "mongoose";

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
import CandidateComparison from "../../src/modules/candidateComparison/candidateComparison.model.js";
import Job from "../../src/modules/job/job.model.js";

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

const restoreEnvValue = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const createOwnerCompanyAndSession = async (suffix) => {
  const ownerData = {
    username: `comparison_owner_${suffix}`,
    email: `comparison.owner.${suffix}@example.com`,
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

const createComparisonJob = async ({ companyId, createdBy, suffix }) => {
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
    username: `com_candidate_${suffix}`,
    email: `comparison.candidate.${suffix}@example.com`,
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
    resumeUrl: `https://example.com/resumes/comparison-${suffix}.pdf`,
    resumePublicId: `comparison-resume-${suffix}`,
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
    userData,
    candidateUser,
    candidate,
    application,
  };
};

describe("AI Candidate Comparison API", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    AI_CANDIDATE_COMPARISON_DAILY_LIMIT:
      process.env.AI_CANDIDATE_COMPARISON_DAILY_LIMIT,

    AI_MAX_COMPARISON_CANDIDATES: process.env.AI_MAX_COMPARISON_CANDIDATES,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-test-model";
    process.env.GEMINI_API_KEY = "test-api-key";

    process.env.AI_CANDIDATE_COMPARISON_DAILY_LIMIT = "5";

    process.env.AI_MAX_COMPARISON_CANDIDATES = "3";

    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreEnvValue("AI_ENABLED", originalEnv.AI_ENABLED);

    restoreEnvValue("AI_PROVIDER", originalEnv.AI_PROVIDER);

    restoreEnvValue("AI_MODEL", originalEnv.AI_MODEL);

    restoreEnvValue("GEMINI_API_KEY", originalEnv.GEMINI_API_KEY);

    restoreEnvValue(
      "AI_CANDIDATE_COMPARISON_DAILY_LIMIT",
      originalEnv.AI_CANDIDATE_COMPARISON_DAILY_LIMIT,
    );

    restoreEnvValue(
      "AI_MAX_COMPARISON_CANDIDATES",
      originalEnv.AI_MAX_COMPARISON_CANDIDATES,
    );
  });

  test("company admin can compare selected candidates", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("generate");

    const job = await createComparisonJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "generate",
    });

    const strong = await createCandidateApplication({
      job,
      suffix: "strong",
      skills: ["React", "Node.js", "MongoDB", "Express.js"],
    });

    /*
     * These fields are part of the normal
     * candidate match signature. The comparison
     * query must load them as well.
     */
    await Candidate.findByIdAndUpdate(strong.candidate._id, {
      $set: {
        linkedinUrl: "https://linkedin.com/in/comparison-strong",

        githubUrl: "https://github.com/comparison-strong",

        portfolioUrl: "https://comparison-strong.example.com",
      },
    });

    const medium = await createCandidateApplication({
      job,
      suffix: "medium",
      skills: ["React", "Node.js"],
    });

    generateAiJson.mockResolvedValue({
      comparisonSummary:
        "Both candidates show relevant MERN experience with different levels of skill coverage.",

      sharedStrengths: ["React", "Node.js"],

      keyDifferences: ["Candidate strong has broader listed skill coverage."],

      interviewFocus: ["Verify project depth", "Verify MongoDB experience"],

      candidates: [
        {
          applicationId: medium.application._id.toString(),
          summary: "Candidate has partial MERN skill coverage.",
          strongestEvidence: ["React and Node.js are listed"],
          concernsToVerify: ["Verify MongoDB and Express.js experience"],
        },

        {
          applicationId: strong.application._id.toString(),
          summary: "Candidate has broad MERN skill coverage.",
          strongestEvidence: ["All listed job skills match"],
          concernsToVerify: ["Verify depth of project ownership"],
        },
      ],
    });

    const initialResponse = await session.agent
      .get(`/api/v1/applications/manage/jobs/${job._id}/applications`)
      .expect(200);

    expect(initialResponse.body.data.aiCandidateComparison).toEqual(
      expect.objectContaining({
        minimumCandidates: 2,
        maximumCandidates: 3,

        eligibleApplicationCount: 2,

        eligibleApplicationIds: expect.arrayContaining([
          strong.application._id.toString(),
          medium.application._id.toString(),
        ]),

        canGenerate: true,
        blockReason: null,

        comparison: null,

        usage: expect.objectContaining({
          featureKey: "candidate_comparison",

          limit: 5,
          used: 0,
          remaining: 5,
        }),
      }),
    );

    /*
     * Loading the applicants page must not
     * invoke the AI provider.
     */
    expect(generateAiJson).not.toHaveBeenCalled();

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/candidate-comparison`,
      {
        applicationIds: [
          medium.application._id.toString(),
          strong.application._id.toString(),
        ],
      },
      201,
    );

    expect(response.body.message).toBe(
      "AI Candidate Comparison generated successfully",
    );

    expect(response.body.data.reused).toBe(false);

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "candidate_comparison",
        limit: 5,
        used: 1,
        remaining: 4,
      }),
    );

    const comparison = response.body.data.comparison;

    expect(comparison.selectedCandidateCount).toBe(2);

    expect(comparison.candidates).toHaveLength(2);

    expect(comparison.candidates[0].applicationId).toBe(
      strong.application._id.toString(),
    );

    expect(comparison.candidates[1].applicationId).toBe(
      medium.application._id.toString(),
    );

    expect(comparison.candidates[0].matchScore).toBeGreaterThan(
      comparison.candidates[1].matchScore,
    );

    expect(comparison).toEqual(
      expect.objectContaining({
        comparisonSummary: expect.any(String),
        sharedStrengths: expect.any(Array),
        keyDifferences: expect.any(Array),
        interviewFocus: expect.any(Array),
      }),
    );

    expect(generateAiJson).toHaveBeenCalledTimes(1);

    const cachedResponse = await session.agent
      .get(`/api/v1/applications/manage/jobs/${job._id}/applications`)
      .expect(200);

    expect(cachedResponse.body.data.aiCandidateComparison).toEqual(
      expect.objectContaining({
        minimumCandidates: 2,
        maximumCandidates: 3,

        eligibleApplicationCount: 2,

        comparison: expect.objectContaining({
          jobId: job._id.toString(),

          selectedCandidateCount: 2,

          candidates: expect.arrayContaining([
            expect.objectContaining({
              applicationId: strong.application._id.toString(),
            }),

            expect.objectContaining({
              applicationId: medium.application._id.toString(),
            }),
          ]),
        }),

        usage: expect.objectContaining({
          used: 1,
          remaining: 4,
        }),
      }),
    );

    const cachedComparisonId =
      cachedResponse.body.data.aiCandidateComparison.comparison.id;

    /*
     * Search, sorting, and pagination must not
     * change the cached comparison.
     */
    const pageSwitchResponse = await session.agent
      .get(
        `/api/v1/applications/manage/jobs/${job._id}/applications?page=2&limit=1&sortBy=appliedAt&order=asc`,
      )
      .expect(200);

    expect(
      pageSwitchResponse.body.data.aiCandidateComparison.comparison.id,
    ).toBe(cachedComparisonId);

    const filteredResponse = await session.agent
      .get(
        `/api/v1/applications/manage/jobs/${job._id}/applications?search=strong`,
      )
      .expect(200);

    expect(filteredResponse.body.data.aiCandidateComparison.comparison.id).toBe(
      cachedComparisonId,
    );

    /*
     * All GET requests must reuse stored data
     * without another AI request.
     */
    expect(generateAiJson).toHaveBeenCalledTimes(1);

    expect(await CandidateComparison.countDocuments()).toBe(1);
  });

  test("same candidate set reuses cached comparison regardless of request order", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("reuse");

    const job = await createComparisonJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "reuse",
    });

    const first = await createCandidateApplication({
      job,
      suffix: "reuse-first",
      skills: ["React", "Node.js", "MongoDB", "Express.js"],
    });

    const second = await createCandidateApplication({
      job,
      suffix: "reuse-second",
      skills: ["React", "Node.js"],
    });

    generateAiJson.mockResolvedValue({
      comparisonSummary: "Candidates compared successfully.",
      candidates: [],
    });

    await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/candidate-comparison`,
      {
        applicationIds: [
          first.application._id.toString(),
          second.application._id.toString(),
        ],
      },
      201,
    );

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/candidate-comparison`,
      {
        applicationIds: [
          second.application._id.toString(),
          first.application._id.toString(),
        ],
      },
      200,
    );

    expect(response.body.message).toBe(
      "AI Candidate Comparison already available",
    );

    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);

    expect(generateAiJson).toHaveBeenCalledTimes(1);

    expect(await CandidateComparison.countDocuments()).toBe(1);
  });

  test("configured maximum comparison size is enforced", async () => {
    process.env.AI_MAX_COMPARISON_CANDIDATES = "2";

    const { owner, company, session } =
      await createOwnerCompanyAndSession("maximum");

    const job = await createComparisonJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "maximum",
    });

    const applications = [];

    for (let index = 1; index <= 3; index += 1) {
      const result = await createCandidateApplication({
        job,
        suffix: `maximum-${index}`,
        skills: ["React", "Node.js"],
      });

      applications.push(result.application);
    }

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/candidate-comparison`,
      {
        applicationIds: applications.map((application) =>
          application._id.toString(),
        ),
      },
      400,
    );

    expect(response.body.message).toBe(
      "You can compare at most 2 candidates at a time",
    );

    expect(generateAiJson).not.toHaveBeenCalled();

    expect(await CandidateComparison.countDocuments()).toBe(0);
  });

  test("applications must belong to the selected job", async () => {
    const { owner, company, session } =
      await createOwnerCompanyAndSession("wrongjob");

    const firstJob = await createComparisonJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "first",
    });

    const secondJob = await createComparisonJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "second",
    });

    const firstApplication = await createCandidateApplication({
      job: firstJob,
      suffix: "first-job",
      skills: ["React", "Node.js"],
    });

    const secondApplication = await createCandidateApplication({
      job: secondJob,
      suffix: "second-job",
      skills: ["React", "MongoDB"],
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${firstJob._id}/candidate-comparison`,
      {
        applicationIds: [
          firstApplication.application._id.toString(),
          secondApplication.application._id.toString(),
        ],
      },
      404,
    );

    expect(response.body.message).toBe(
      "One or more applications were not found for this job",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("candidate cannot access AI Candidate Comparison", async () => {
    const candidateData = {
      username: "comparison_candidate_blocked",
      email: "comparison.candidate.blocked@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const fakeJobId = new mongoose.Types.ObjectId().toString();

    const fakeApplicationIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString(),
    ];

    const response = await postWithCsrf(
      candidateSession.agent,
      `/api/v1/ai/jobs/${fakeJobId}/candidate-comparison`,
      {
        applicationIds: fakeApplicationIds,
      },
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
  });
});
