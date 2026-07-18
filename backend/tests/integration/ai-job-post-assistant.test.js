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

import AiUsage from "../../src/modules/aiUsage/aiUsage.model.js";

import { ROLES } from "../../src/config/constants.js";

import { generateAiJson } from "../../src/modules/ai/aiProvider.service.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

import { createCompanyForOwner } from "../helpers/business.helpers.js";

const buildJobDraft = (suffix = "base") => ({
  title: `MERN Developer ${suffix}`,

  description:
    "We need a developer to build and maintain web application features.",

  responsibilities: ["Build frontend components", "Create backend APIs"],

  requirements: ["JavaScript fundamentals", "Basic MERN stack experience"],

  skills: ["JavaScript", "React", "Node.js", "MongoDB"],

  location: "Pune",

  employmentType: "full-time",

  workplaceType: "hybrid",

  experienceLevel: "entry",

  salaryMin: 300000,

  salaryMax: 600000,

  salaryCurrency: "INR",

  isSalaryVisible: true,
});

const buildProviderOutput = () => ({
  improvedTitle: "Junior MERN Stack Developer",

  improvedDescription:
    "Join our team to build reliable web application features using React, Node.js, Express, and MongoDB.",

  improvedResponsibilities: [
    "Build reusable React components",
    "Design and maintain REST APIs",
    "Collaborate on MongoDB schema design",
  ],

  improvedRequirements: [
    "Strong JavaScript fundamentals",
    "Basic experience with React and Node.js",
    "Understanding of REST APIs and MongoDB",
  ],

  recommendedSkills: [
    "JavaScript",
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Git",
  ],

  qualityNotes: [
    "Add information about the interview process",
    "Clarify whether deployment knowledge is required",
  ],

  missingInformation: ["Benefits", "Expected joining timeline"],
});

const createOwnerCompanyAndSession = async (suffix = "base") => {
  const ownerData = {
    username: `job_post_owner_${suffix}`,
    email: `job.post.owner.${suffix}@example.com`,
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

describe("AI Job Post Assistant API", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_BASE_URL: process.env.GEMINI_API_BASE_URL,
    AI_JOB_POST_SUGGESTION_DAILY_LIMIT:
      process.env.AI_JOB_POST_SUGGESTION_DAILY_LIMIT,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-test-model";
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_API_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta";

    process.env.AI_JOB_POST_SUGGESTION_DAILY_LIMIT = "2";

    vi.clearAllMocks();

    generateAiJson.mockResolvedValue(buildProviderOutput());
  });

  afterEach(() => {
    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;

    process.env.AI_JOB_POST_SUGGESTION_DAILY_LIMIT =
      originalEnv.AI_JOB_POST_SUGGESTION_DAILY_LIMIT;
  });

  test("company admin can generate AI Job Post Assistant suggestions", async () => {
    const { session } = await createOwnerCompanyAndSession("generate");

    const eligibilityResponse = await session.agent
      .get("/api/v1/company")
      .expect(200);

    expect(eligibilityResponse.body.data.aiJobPostAssistant).toEqual(
      expect.objectContaining({
        hasCompanyProfile: true,

        canGenerate: true,
        blockReason: null,

        usage: expect.objectContaining({
          featureKey: "job_post_suggestion",

          limit: 2,
          used: 0,
          remaining: 2,

          resetAt: expect.any(String),
        }),
      }),
    );

    /*
     * Reading company and usage state must
     * not invoke the AI provider.
     */
    expect(generateAiJson).not.toHaveBeenCalled();

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("generate"),
      200,
    );

    const updatedEligibilityResponse = await session.agent
      .get("/api/v1/company")
      .expect(200);

    expect(updatedEligibilityResponse.body.data.aiJobPostAssistant).toEqual(
      expect.objectContaining({
        hasCompanyProfile: true,

        canGenerate: true,
        blockReason: null,

        usage: expect.objectContaining({
          used: 1,
          remaining: 1,
        }),
      }),
    );

    expect(response.body.message).toBe(
      "AI Job Post Assistant suggestions generated successfully",
    );

    expect(response.body.data.suggestions).toEqual(
      expect.objectContaining({
        improvedTitle: "Junior MERN Stack Developer",
        improvedDescription: expect.any(String),
        improvedResponsibilities: expect.any(Array),
        improvedRequirements: expect.any(Array),
        recommendedSkills: expect.any(Array),
        qualityNotes: expect.any(Array),
        missingInformation: expect.any(Array),
      }),
    );

    expect(response.body.data.usage).toEqual(
      expect.objectContaining({
        featureKey: "job_post_suggestion",
        limit: 2,
        used: 1,
        remaining: 1,
      }),
    );

    expect(generateAiJson).toHaveBeenCalledTimes(1);
  });

  test("job post suggestions are not automatically saved as a job", async () => {
    const { session } = await createOwnerCompanyAndSession("nosave");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("nosave"),
      200,
    );

    expect(response.body.data).not.toHaveProperty("job");
    expect(response.body.data).not.toHaveProperty("jobId");
  });

  test("invalid empty job draft returns validation error", async () => {
    const { session } = await createOwnerCompanyAndSession("validation");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      {},
      400,
    );

    expect(response.body.message).toBe("Validation failed");
    expect(generateAiJson).not.toHaveBeenCalled();

    expect(await AiUsage.countDocuments()).toBe(0);
  });

  test("candidate cannot use AI Job Post Assistant", async () => {
    const candidateData = {
      username: "job_post_candidate_blocked",
      email: "job.post.candidate.blocked@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await postWithCsrf(
      candidateSession.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("blocked"),
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
  });

  test("daily AI Job Post Assistant limit is enforced", async () => {
    const { session } = await createOwnerCompanyAndSession("limit");

    await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("first"),
      200,
    );

    await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("second"),
      200,
    );

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("third"),
      429,
    );

    expect(response.body.message).toBe(
      "Daily AI usage limit reached for this feature. Please try again tomorrow.",
    );

    expect(generateAiJson).toHaveBeenCalledTimes(2);
  });

  test("AI disabled returns service unavailable without consuming usage", async () => {
    process.env.AI_ENABLED = "false";

    const { session } = await createOwnerCompanyAndSession("disabled");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/ai/jobs/post-suggestions",
      buildJobDraft("disabled"),
      503,
    );

    expect(response.body.message).toBe(
      "AI features are currently unavailable. Please try again later.",
    );

    expect(generateAiJson).not.toHaveBeenCalled();
    expect(await AiUsage.countDocuments()).toBe(0);
  });
});
