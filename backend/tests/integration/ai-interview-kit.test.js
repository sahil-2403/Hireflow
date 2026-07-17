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

const buildProviderInterviewKitOutput = () => ({
  technicalQuestions: [
    {
      question: "Explain how you designed REST APIs in your MERN project.",
      whyAsk: "The role requires Node.js and Express API work.",
    },
  ],
  projectQuestions: [
    {
      question: "Walk me through the architecture of your HireFlow project.",
      whyAsk: "Resume analysis shows a MERN project.",
    },
  ],
  skillGapQuestions: [
    {
      question: "Have you deployed a Node.js application before?",
      whyAsk: "Deployment experience is not clearly visible.",
    },
  ],
  behavioralQuestions: [
    {
      question:
        "Tell us about a time you debugged a difficult production-like issue.",
      whyAsk: "This checks problem-solving approach.",
    },
  ],
  evaluationChecklist: [
    "Can explain React component structure",
    "Can explain backend route/controller/service flow",
    "Understands MongoDB schema design",
    "Can discuss authentication security",
  ],
});

const createOwnerCompanyAndSession = async (suffix = "base") => {
  const ownerData = {
    username: `kit_owner_${suffix}`,
    email: `kit.owner.${suffix}@example.com`,
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

const createCandidateForKit = async (suffix = "base") => {
  const candidateData = {
    username: `kit_candidate_${suffix}`,
    email: `kit.candidate.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const candidateUser = await createVerifiedUser(candidateData);

  const candidate = await Candidate.create({
    userId: candidateUser._id,
    firstName: "Kit",
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
    resumeUrl: `https://example.com/resumes/kit-${suffix}.pdf`,
    resumePublicId: `kit-resume-public-id-${suffix}`,
  });

  return {
    candidateUser,
    candidate,
  };
};

const createKitJob = async ({ companyId, createdBy, suffix = "base" }) => {
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

const createApplicationForKit = async ({ job, candidate, candidateUser }) => {
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
    resumeSignature: `kit-signature-${candidate._id}`,
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

describe("AI Interview Kit API", () => {
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
    generateAiJson.mockResolvedValue(buildProviderInterviewKitOutput());
  });

  afterEach(() => {
    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;
  });

  test("company admin can generate AI Interview Kit", async () => {
    const { owner, company, ownerSession } =
      await createOwnerCompanyAndSession("generate");

    const { candidateUser, candidate } =
      await createCandidateForKit("generate");

    await createCompletedResumeAnalysis({
      candidateUser,
      candidate,
    });

    const job = await createKitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "generate",
    });

    const application = await createApplicationForKit({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/interview-kit`,
      {},
      201,
    );

    expect(response.body.message).toBe(
      "AI Interview Kit generated successfully",
    );

    expect(response.body.data.reused).toBe(false);

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "interview_kit",
        limit: 10,
        used: 1,
        remaining: 9,
      }),
    );

    expect(response.body.data.interviewKit).toEqual(
      expect.objectContaining({
        technicalQuestions: expect.any(Array),
        projectQuestions: expect.any(Array),
        skillGapQuestions: expect.any(Array),
        behavioralQuestions: expect.any(Array),
        evaluationChecklist: expect.any(Array),
      }),
    );

    expect(response.body.data.interviewKit.technicalQuestions[0]).toEqual(
      expect.objectContaining({
        question: expect.any(String),
        whyAsk: expect.any(String),
      }),
    );

    expect(generateAiJson).toHaveBeenCalledTimes(1);

    const savedApplication = await Application.findById(application._id).select(
      "+interviewKitSnapshot",
    );

    expect(savedApplication.interviewKitSnapshot).not.toBeNull();
  });

  test("same application reuses cached AI Interview Kit", async () => {
    const { owner, company, ownerSession } =
      await createOwnerCompanyAndSession("reuse");

    const { candidateUser, candidate } = await createCandidateForKit("reuse");

    await createCompletedResumeAnalysis({
      candidateUser,
      candidate,
    });

    const job = await createKitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "reuse",
    });

    const application = await createApplicationForKit({
      job,
      candidate,
      candidateUser,
    });

    await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/interview-kit`,
      {},
      201,
    );

    const response = await postWithCsrf(
      ownerSession.agent,
      `/api/v1/ai/applications/${application._id}/interview-kit`,
      {},
      200,
    );

    expect(response.body.message).toBe(
      "AI Interview Kit already available for this application",
    );

    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);
    expect(generateAiJson).toHaveBeenCalledTimes(1);
  });

  test("candidate cannot access AI Interview Kit endpoint", async () => {
    const { owner, company } = await createOwnerCompanyAndSession("blocked");
    const { candidateUser, candidate } = await createCandidateForKit("blocked");

    const candidateSession = await loginUser({
      email: "kit.candidate.blocked@example.com",
      password: "Password123",
    });

    const job = await createKitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "blocked",
    });

    const application = await createApplicationForKit({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      candidateSession.agent,
      `/api/v1/ai/applications/${application._id}/interview-kit`,
      {},
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("company admin cannot generate interview kit for another company's application", async () => {
    const { owner, company } = await createOwnerCompanyAndSession("source");
    const { ownerSession: otherOwnerSession } =
      await createOwnerCompanyAndSession("other");

    const { candidateUser, candidate } = await createCandidateForKit("other");

    const job = await createKitJob({
      companyId: company._id,
      createdBy: owner._id,
      suffix: "other",
    });

    const application = await createApplicationForKit({
      job,
      candidate,
      candidateUser,
    });

    const response = await postWithCsrf(
      otherOwnerSession.agent,
      `/api/v1/ai/applications/${application._id}/interview-kit`,
      {},
      404,
    );

    expect(response.body.message).toBe("Application not found");
    expect(generateAiJson).not.toHaveBeenCalled();
  });
});
