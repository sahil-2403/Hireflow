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

import Candidate from "../../src/modules/candidate/candidate.model.js";
import Job from "../../src/modules/job/job.model.js";
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";
import JobResumeFit from "../../src/modules/jobResumeFit/jobResumeFit.model.js";

import {
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  ROLES,
  WORKPLACE_TYPE,
} from "../../src/config/constants.js";

import { generateAiJson } from "../../src/modules/ai/aiProvider.service.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

import { createCompanyForOwner } from "../helpers/business.helpers.js";

const buildProviderFitOutput = () => ({
  summary:
    "Your resume fits this MERN role well because it shows React and backend project experience.",
  matchedRequirements: ["React experience", "Node.js backend exposure"],
  missingRequirements: ["Testing experience", "Deployment experience"],
  resumeImprovements: ["Add deployment details to the HireFlow project"],
  profileImprovements: ["Add Express.js to your profile skills"],
  beforeApplyingChecklist: [
    "Update project bullets",
    "Add GitHub link",
    "Mention REST API work",
  ],
});

const createOwnerAndCompany = async (suffix = "base") => {
  const ownerData = {
    username: `fit_owner_${suffix}`,
    email: `fit.owner.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.OWNER,
  };

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  return {
    owner,
    company,
  };
};

const createCandidateWithResumeAnalysis = async (suffix = "base") => {
  const candidateData = {
    username: `fit_candidate_${suffix}`,
    email: `fit.candidate.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const candidateUser = await createVerifiedUser(candidateData);

  const candidate = await Candidate.create({
    userId: candidateUser._id,
    firstName: "Fit",
    lastName: "Candidate",
    headline: "Junior React Developer",
    summary: "Frontend developer learning MERN backend.",
    skills: ["React"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune",
    targetJobTitles: ["React Developer"],
    preferredLocations: ["Pune"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: `https://example.com/resumes/${suffix}.pdf`,
    resumePublicId: `resume-public-id-${suffix}`,
  });

  const resumeSignature =
    await import("../../src/modules/resumeAnalysis/resumeAnalysis.service.js").then(
      ({ createResumeSignature }) =>
        createResumeSignature({
          resumeUrl: candidate.resumeUrl,
          resumePublicId: candidate.resumePublicId,
        }),
    );

  const resumeAnalysis = await ResumeAnalysis.create({
    candidateUserId: candidateUser._id,
    candidateProfileId: candidate._id,
    sourceType: "candidate_profile_resume",
    resumeUrl: candidate.resumeUrl,
    resumePublicId: candidate.resumePublicId,
    resumeSignature,
    status: "completed",
    extracted: {
      skills: ["Node.js", "MongoDB", "Express.js"],
      programmingLanguages: ["JavaScript"],
      frameworks: ["Express.js"],
      databases: ["MongoDB"],
      tools: ["Postman"],
      targetRoles: ["MERN Developer"],
      projects: [
        {
          name: "HireFlow",
          technologies: ["React", "Node.js", "MongoDB", "Express.js"],
        },
      ],
    },
    evaluation: {
      resumeScore: 82,
      strengths: ["Relevant MERN stack project"],
    },
    provider: "gemini",
    model: "gemini-test-model",
    analyzedAt: new Date(),
  });

  const session = await loginUser({
    email: candidateData.email,
    password: candidateData.password,
  });

  return {
    candidateData,
    candidateUser,
    candidate,
    resumeAnalysis,
    session,
  };
};

const createFitJob = async ({ companyId, createdBy, suffix = "base" }) => {
  return Job.create({
    companyId,
    createdBy,
    title: `Junior MERN Developer ${suffix}`,
    description:
      "Build and maintain MERN stack applications with React, Node.js, Express, and MongoDB.",
    responsibilities: ["Build React UI", "Create REST APIs"],
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

describe("AI Resume Fit API", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_BASE_URL: process.env.GEMINI_API_BASE_URL,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-test-model";
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_API_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta";

    vi.clearAllMocks();

    generateAiJson.mockResolvedValue(buildProviderFitOutput());
  });

  afterEach(() => {
    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;
  });

  test("candidate can generate AI Resume Fit for a job", async () => {
    const { owner, company } = await createOwnerAndCompany("generate");
    const { session } = await createCandidateWithResumeAnalysis("generate");

    const job = await createFitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "generate",
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/resume-fit`,
      {},
      201,
    );

    expect(response.body.message).toBe("AI Resume Fit generated successfully");
    expect(response.body.data.reused).toBe(false);

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "job_resume_fit",
        limit: 3,
        used: 1,
        remaining: 2,
      }),
    );

    expect(response.body.data.fit).toEqual(
      expect.objectContaining({
        enhancedMatchScore: expect.any(Number),
        matchBasis: "profile_and_resume",
        profileScore: expect.any(Number),
        resumeBoost: expect.any(Number),
        summary: expect.any(String),
      }),
    );

    expect(response.body.data.fit.resumeBoost).toBeGreaterThan(0);
    expect(generateAiJson).toHaveBeenCalledTimes(1);
    expect(await JobResumeFit.countDocuments()).toBe(1);
  });

  test("same job reuses cached AI Resume Fit", async () => {
    const { owner, company } = await createOwnerAndCompany("reuse");
    const { session } = await createCandidateWithResumeAnalysis("reuse");

    const job = await createFitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "reuse",
    });

    await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/resume-fit`,
      {},
      201,
    );

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/resume-fit`,
      {},
      200,
    );

    expect(response.body.message).toBe(
      "AI Resume Fit already available for this job",
    );
    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);
    expect(generateAiJson).toHaveBeenCalledTimes(1);
    expect(await JobResumeFit.countDocuments()).toBe(1);
  });

  test("candidate needs completed AI Resume Insights before AI Resume Fit", async () => {
    const { owner, company } = await createOwnerAndCompany("missinganalysis");

    const candidateData = {
      username: "fit_candidate_missinganalysis",
      email: "fit.candidate.missinganalysis@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    const candidateUser = await createVerifiedUser(candidateData);

    await Candidate.create({
      userId: candidateUser._id,
      firstName: "No",
      lastName: "Analysis",
      skills: ["React"],
      experienceLevel: EXPERIENCE_LEVEL.ENTRY,
      location: "Pune",
      resumeUrl: "https://example.com/resumes/no-analysis.pdf",
      resumePublicId: "no-analysis-public-id",
    });

    const session = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const job = await createFitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "missinganalysis",
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${job._id}/resume-fit`,
      {},
      400,
    );

    expect(response.body.message).toBe(
      "Generate AI Resume Insights before checking AI Resume Fit for this job",
    );
    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("daily AI Resume Fit limit is enforced for different jobs", async () => {
    const { owner, company } = await createOwnerAndCompany("limit");
    const { session } = await createCandidateWithResumeAnalysis("limit");

    for (let index = 1; index <= 3; index += 1) {
      const job = await createFitJob({
        companyId: company._id,
        createdBy: owner._id,
        suffix: `limit-${index}`,
      });

      await postWithCsrf(
        session.agent,
        `/api/v1/ai/jobs/${job._id}/resume-fit`,
        {},
        201,
      );
    }

    const fourthJob = await createFitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "limit-4",
    });

    const response = await postWithCsrf(
      session.agent,
      `/api/v1/ai/jobs/${fourthJob._id}/resume-fit`,
      {},
      429,
    );

    expect(response.body.message).toBe(
      "Daily AI usage limit reached for this feature. Please try again tomorrow.",
    );
    expect(generateAiJson).toHaveBeenCalledTimes(3);
  });

  test("company user cannot access AI Resume Fit endpoint", async () => {
    const { owner, company } = await createOwnerAndCompany("companyblocked");

    const ownerSession = await loginUser({
      email: "fit.owner.companyblocked@example.com",
      password: "Password123",
    });

    const job = await createFitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "companyblocked",
    });

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/jobs/${job._id}/resume-fit`,
      {},
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });
});
