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
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";

import {
  EXPERIENCE_LEVEL,
  RESUME_ANALYSIS_STATUS,
  ROLES,
} from "../../src/config/constants.js";

import { generateAiJson } from "../../src/modules/ai/aiProvider.service.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

const buildProviderResumeOutput = () => ({
  extracted: {
    fullName: "Test Candidate",
    email: "test.candidate@example.com",
    phone: "9999999999",
    location: "Pune",
    summary: "Junior MERN developer with project experience.",
    targetRoles: ["Junior MERN Developer", "React Developer"],
    skills: ["React", "Node.js", "MongoDB", "Express.js"],
    programmingLanguages: ["JavaScript"],
    frameworks: ["React", "Express.js"],
    databases: ["MongoDB"],
    tools: ["Git", "Postman"],
    projects: [
      {
        name: "HireFlow",
        description: "Job portal project built with MERN stack.",
        technologies: ["React", "Node.js", "MongoDB"],
        impact: "Built application workflow and role-based access.",
        links: ["https://github.com/example/hireflow"],
      },
    ],
    experience: [],
    education: [
      {
        degree: "BCA",
        institution: "Test University",
        year: "2026",
      },
    ],
    certifications: ["JavaScript Basics"],
    links: ["https://github.com/example"],
  },
  evaluation: {
    resumeScore: 78,
    strengths: ["Relevant MERN stack skills"],
    weaknesses: ["Deployment experience is unclear"],
    missingKeywords: ["Testing", "Deployment"],
    atsIssues: ["Add more measurable project impact"],
    improvementSuggestions: ["Add deployment details to project section"],
    recommendedProfileUpdates: {
      headline: "Junior MERN Stack Developer",
      summary: "MERN developer focused on React, Node.js, and MongoDB.",
      skills: ["Express.js", "REST APIs"],
      targetJobTitles: ["MERN Developer"],
    },
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

const setupCandidateWithResume = async (suffix = "base", overrides = {}) => {
  const userData = {
    username: `ai_resume_candidate_${suffix}`,
    email: `ai.resume.candidate.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const user = await createVerifiedUser(userData);

  const candidate = await Candidate.create({
    userId: user._id,
    firstName: "Test",
    lastName: "Candidate",
    headline: "Junior MERN Developer",
    summary: "Building MERN stack projects.",
    skills: ["react", "node.js"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune",
    targetJobTitles: ["MERN Developer"],
    preferredLocations: ["Pune"],
    preferredWorkplaceTypes: ["hybrid"],
    preferredEmploymentTypes: ["full-time"],
    resumeUrl: "https://example.com/resumes/test-resume.pdf",
    resumePublicId: "hireflow/resumes/test-resume",
    ...overrides,
  });

  const session = await loginUser({
    email: userData.email,
    password: userData.password,
  });

  return {
    userData,
    user,
    candidate,
    session,
  };
};

describe("AI Resume Insights API", () => {
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

    generateAiJson.mockResolvedValue(buildProviderResumeOutput());
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;
  });

  test("candidate can generate AI Resume Insights", async () => {
    const { candidate, session } = await setupCandidateWithResume("generate");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "AI Resume Insights generated successfully",
    );

    expect(response.body.data.reused).toBe(false);
    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "resume_analysis",
        limit: 1,
        used: 1,
        remaining: 0,
      }),
    );

    expect(response.body.data.analysis).toEqual(
      expect.objectContaining({
        status: RESUME_ANALYSIS_STATUS.COMPLETED,
        sourceType: "candidate_profile_resume",
        resumeUrl: candidate.resumeUrl,
        resumePublicId: candidate.resumePublicId,
      }),
    );

    expect(response.body.data.analysis.extracted.skills).toEqual([
      "React",
      "Node.js",
      "MongoDB",
      "Express.js",
    ]);

    expect(response.body.data.analysis.evaluation.resumeScore).toBe(78);

    expect(generateAiJson).toHaveBeenCalledTimes(1);

    const savedAnalysis = await ResumeAnalysis.findOne({
      candidateUserId: candidate.userId,
    });

    expect(savedAnalysis).not.toBeNull();
    expect(savedAnalysis.status).toBe(RESUME_ANALYSIS_STATUS.COMPLETED);
  });

  test("candidate can fetch latest AI Resume Insights", async () => {
    const { session } = await setupCandidateWithResume("fetch");

    await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      201,
    );

    const response = await session.agent
      .get("/api/v1/ai/candidates/resume/analysis")
      .expect(200);

    expect(response.body.message).toBe(
      "AI Resume Insights fetched successfully",
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        hasResume: true,
        isFresh: true,
      }),
    );

    expect(response.body.data.analysis).toEqual(
      expect.objectContaining({
        status: RESUME_ANALYSIS_STATUS.COMPLETED,
      }),
    );
  });

  test("same resume reuses completed analysis instead of consuming usage again", async () => {
    const { session } = await setupCandidateWithResume("reuse");

    await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      201,
    );

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      200,
    );

    expect(response.body.message).toBe(
      "AI Resume Insights already available for this resume",
    );

    expect(response.body.data.reused).toBe(true);
    expect(response.body.data.usage.used).toBe(1);
    expect(response.body.data.usage.remaining).toBe(0);

    expect(generateAiJson).toHaveBeenCalledTimes(1);
    expect(await ResumeAnalysis.countDocuments()).toBe(1);
  });

  test("candidate without resume cannot generate AI Resume Insights", async () => {
    const { session } = await setupCandidateWithResume("noresume", {
      resumeUrl: null,
      resumePublicId: null,
    });

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      400,
    );

    expect(response.body.message).toBe("Resume file is required");
    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("company user cannot access candidate AI Resume Insights endpoint", async () => {
    const ownerData = {
      username: "ai_resume_owner",
      email: "ai.resume.owner@example.com",
      password: "Password123",
      role: ROLES.OWNER,
    };

    await createVerifiedUser(ownerData);

    const ownerSession = await loginUser({
      email: ownerData.email,
      password: ownerData.password,
    });

    const response = await postWithCsrf(
      ownerSession.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("AI disabled returns service unavailable without consuming usage", async () => {
    process.env.AI_ENABLED = "false";

    const { candidate, session } = await setupCandidateWithResume("disabled");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/candidates/resume/analyze",
      {},
      503,
    );

    expect(response.body.message).toBe(
      "AI features are currently unavailable. Please try again later.",
    );

    expect(generateAiJson).not.toHaveBeenCalled();

    expect(
      await ResumeAnalysis.countDocuments({
        candidateUserId: candidate.userId,
      }),
    ).toBe(0);
  });
});
