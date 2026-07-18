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
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";

import {
  APPLICATION_STATUS,
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  ROLES,
  WORKPLACE_TYPE,
} from "../../src/config/constants.js";

import { generateAiJson } from "../../src/modules/ai/aiProvider.service.js";
import { createApplicationMatchSnapshot } from "../../src/modules/application/applicationMatch.service.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

import { createCompanyForOwner } from "../helpers/business.helpers.js";

const buildProviderReviewOutput = () => ({
  summary:
    "The resume strongly supports this candidate's fit for the MERN Developer role.",
  matchedEvidence: [
    {
      requirement: "React experience",
      evidence: "Resume analysis includes React project work.",
    },
    {
      requirement: "Node.js backend",
      evidence: "Resume analysis includes Node.js and Express.js.",
    },
  ],
  missingOrWeakAreas: ["Deployment experience is not clearly mentioned"],
  resumeStrengths: ["Relevant MERN stack project experience"],
  interviewFocus: ["Ask the candidate to explain their REST API design"],
  riskNotes: ["Verify project depth during interview"],
});

const buildProviderResumeOutput = () => ({
  extracted: {
    fullName: "Review Candidate",
    skills: ["React", "Node.js", "MongoDB", "Express.js"],
    programmingLanguages: ["JavaScript"],
    frameworks: ["React", "Express.js"],
    databases: ["MongoDB"],
    tools: ["Git", "Postman"],
    targetRoles: ["MERN Developer"],
    projects: [
      {
        name: "HireFlow",
        technologies: ["React", "Node.js", "MongoDB", "Express.js"],
      },
    ],
  },
  evaluation: {
    resumeScore: 84,
    strengths: ["Relevant MERN stack project"],
    weaknesses: ["Deployment experience unclear"],
    improvementSuggestions: ["Add deployment details"],
  },
});

const mockResumeDownload = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("%PDF-1.4 fake resume").buffer,
    }),
  );
};

const createOwnerCompanyAndSession = async (suffix = "base") => {
  const ownerData = {
    username: `review_owner_${suffix}`,
    email: `review.owner.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.OWNER,
  };

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  const ownerSession = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  return {
    owner,
    company,
    ownerSession,
  };
};

const createCandidateForReview = async (suffix = "base") => {
  const candidateData = {
    username: `review_${suffix}`,
    email: `review.candidate.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const candidateUser = await createVerifiedUser(candidateData);

  const candidate = await Candidate.create({
    userId: candidateUser._id,
    firstName: "Review",
    lastName: "Candidate",
    headline: "Junior React Developer",
    summary: "Frontend developer with MERN project experience.",
    skills: ["React"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune",
    targetJobTitles: ["React Developer"],
    preferredLocations: ["Pune"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: `https://example.com/resumes/review-${suffix}.pdf`,
    resumePublicId: `review-resume-public-id-${suffix}`,
  });

  return {
    candidateUser,
    candidate,
  };
};

const createReviewJob = async ({ companyId, createdBy, suffix = "base" }) => {
  return Job.create({
    companyId,
    createdBy,
    title: `Junior MERN Developer ${suffix}`,
    description:
      "Build MERN stack applications with React, Node.js, Express, and MongoDB.",
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

const createApplicationForReview = async ({
  job,
  candidate,
  candidateUser,
}) => {
  return Application.create({
    jobId: job._id,
    candidateId: candidate._id,
    candidateUserId: candidateUser._id,
    companyId: job.companyId,
    coverLetter: "I am interested in this MERN developer role.",
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
};

const createCompletedResumeAnalysis = async ({ candidateUser, candidate }) => {
  return ResumeAnalysis.create({
    candidateUserId: candidateUser._id,
    candidateProfileId: candidate._id,
    sourceType: "candidate_profile_resume",
    resumeUrl: candidate.resumeUrl,
    resumePublicId: candidate.resumePublicId,
    resumeSignature: `review-signature-${candidate._id}`,
    status: "completed",
    extracted: {
      skills: ["Node.js", "MongoDB", "Express.js"],
      programmingLanguages: ["JavaScript"],
      frameworks: ["Express.js"],
      databases: ["MongoDB"],
      targetRoles: ["MERN Developer"],
      projects: [
        {
          name: "HireFlow",
          technologies: ["React", "Node.js", "MongoDB", "Express.js"],
        },
      ],
    },
    evaluation: {
      resumeScore: 84,
      strengths: ["Relevant MERN stack project"],
    },
    provider: "gemini",
    model: "gemini-test-model",
    analyzedAt: new Date(),
  });
};

describe("AI Application Resume Match Review API", () => {
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
    mockResumeDownload();
    generateAiJson.mockResolvedValue(buildProviderReviewOutput());
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;
  });

  test("company admin can generate AI Resume Match Review", async () => {
    const { owner, company, ownerSession } =
      await createOwnerCompanyAndSession("generate");

    const { candidateUser, candidate } =
      await createCandidateForReview("generate");

    await createCompletedResumeAnalysis({
      candidateUser,
      candidate,
    });

    const job = await createReviewJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "generate",
    });

    const application = await createApplicationForReview({
      job,
      candidate,
      candidateUser,
    });

    const eligibilityResponse = await ownerSession.agent
      .get(
        `/api/v1/applications/manage/jobs/${job._id}/applications/${application._id}`,
      )
      .expect(200);

    expect(eligibilityResponse.body.data.aiResumeReview).toEqual(
      expect.objectContaining({
        hasResume: true,
        hasJobData: true,
        hasCandidateData: true,

        canGenerate: true,
        blockReason: null,
        review: null,

        usage: expect.objectContaining({
          featureKey: "company_resume_review",

          limit: 10,
          used: 0,
          remaining: 10,
        }),
      }),
    );

    /*
     * The read-only eligibility request must
     * not invoke the provider.
     */
    expect(generateAiJson).not.toHaveBeenCalled();

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      201,
    );

    expect(response.body.message).toBe(
      "AI Resume Match Review generated successfully",
    );

    const cachedDetailsResponse = await ownerSession.agent
      .get(
        `/api/v1/applications/manage/jobs/${job._id}/applications/${application._id}`,
      )
      .expect(200);

    expect(cachedDetailsResponse.body.data.aiResumeReview).toEqual(
      expect.objectContaining({
        hasResume: true,

        canGenerate: false,
        blockReason: null,

        review: expect.objectContaining({
          applicationId: application._id.toString(),

          jobId: job._id.toString(),

          enhancedMatchScore: expect.any(Number),

          matchBasis: "profile_and_resume",

          summary: expect.any(String),

          matchedEvidence: expect.any(Array),

          interviewFocus: expect.any(Array),
        }),

        usage: expect.objectContaining({
          used: 1,
          remaining: 9,
        }),
      }),
    );

    expect(response.body.data.reused).toBe(false);

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "company_resume_review",
        limit: 10,
        used: 1,
        remaining: 9,
      }),
    );

    expect(response.body.data.review).toEqual(
      expect.objectContaining({
        enhancedMatchScore: expect.any(Number),
        matchBasis: "profile_and_resume",
        summary: expect.any(String),
        matchedEvidence: expect.any(Array),
        interviewFocus: expect.any(Array),
      }),
    );

    expect(generateAiJson).toHaveBeenCalledTimes(1);

    const savedApplication = await Application.findById(application._id).select(
      "+resumeReviewSnapshot",
    );

    expect(savedApplication.resumeReviewSnapshot).not.toBeNull();
    expect(savedApplication.resumeReviewSnapshot.summary).toContain("resume");
  });

  test("same application reuses cached AI Resume Match Review", async () => {
    const { owner, company, ownerSession } =
      await createOwnerCompanyAndSession("reuse");

    const { candidateUser, candidate } =
      await createCandidateForReview("reuse");

    await createCompletedResumeAnalysis({
      candidateUser,
      candidate,
    });

    const job = await createReviewJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "reuse",
    });

    const application = await createApplicationForReview({
      job,
      candidate,
      candidateUser,
    });

    await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      201,
    );

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      200,
    );

    expect(response.body.message).toBe(
      "AI Resume Match Review already available for this application",
    );

    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);
    expect(generateAiJson).toHaveBeenCalledTimes(1);
  });

  test("company review creates application resume analysis when none exists", async () => {
    generateAiJson
      .mockResolvedValueOnce(buildProviderResumeOutput())
      .mockResolvedValueOnce(buildProviderReviewOutput());

    const { owner, company, ownerSession } =
      await createOwnerCompanyAndSession("createsanalysis");

    const { candidateUser, candidate } =
      await createCandidateForReview("createsanalysis");

    const job = await createReviewJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "createsanalysis",
    });

    const application = await createApplicationForReview({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      201,
    );

    expect(response.body.message).toBe(
      "AI Resume Match Review generated successfully",
    );

    expect(generateAiJson).toHaveBeenCalledTimes(2);

    const applicationResumeAnalysis = await ResumeAnalysis.findOne({
      candidateUserId: candidateUser._id,
      sourceType: "application_resume",
      status: "completed",
    });

    expect(applicationResumeAnalysis).not.toBeNull();
  });

  test("candidate cannot access company AI Resume Match Review endpoint", async () => {
    const { owner, company } = await createOwnerCompanyAndSession("blocked");
    const { candidateUser, candidate } =
      await createCandidateForReview("blocked");

    const candidateSession = await loginUser({
      email: "review.candidate.blocked@example.com",
      password: "Password123",
    });

    const job = await createReviewJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "blocked",
    });

    const application = await createApplicationForReview({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      candidateSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("company admin cannot review another company's application", async () => {
    const { owner, company } = await createOwnerCompanyAndSession("source");
    const { ownerSession: otherOwnerSession } =
      await createOwnerCompanyAndSession("other");

    const { candidateUser, candidate } =
      await createCandidateForReview("other");

    const job = await createReviewJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "other",
    });

    const application = await createApplicationForReview({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      otherOwnerSession.agent,
      `/api/v1/ai/applications/${application._id}/resume-review`,
      {},
      404,
    );

    expect(response.body.message).toBe("Application not found");
  });
});
