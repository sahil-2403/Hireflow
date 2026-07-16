import mongoose from "mongoose";

import {
  EXPERIENCE_LEVEL,
  RESUME_ANALYSIS_SOURCE_TYPES,
  RESUME_ANALYSIS_STATUS,
  ROLES,
} from "../../src/config/constants.js";

import User from "../../src/modules/auth/auth.model.js";
import Candidate from "../../src/modules/candidate/candidate.model.js";
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";

import {
  buildApplicationResumeSource,
  buildCandidateProfileResumeSource,
  completeResumeAnalysis,
  createPendingResumeAnalysis,
  createResumeSignature,
  failResumeAnalysis,
  findLatestCompletedResumeAnalysis,
  findLatestResumeAnalysis,
  isResumeAnalysisFreshForSource,
} from "../../src/modules/resumeAnalysis/resumeAnalysis.service.js";

const createCandidateWithResume = async (suffix = "base", overrides = {}) => {
  const user = await User.create({
    username: `resume_user_${suffix}`,
    email: `resume.user.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.CANDIDATE,
    isEmailVerified: true,
  });

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

  return {
    user,
    candidate,
  };
};

describe("Resume analysis service", () => {
  test("creates deterministic resume signatures", () => {
    const firstSignature = createResumeSignature({
      resumeUrl: "https://example.com/resume.pdf",
      resumePublicId: "resume-public-id",
    });

    const secondSignature = createResumeSignature({
      resumeUrl: "https://example.com/resume.pdf",
      resumePublicId: "resume-public-id",
    });

    const changedSignature = createResumeSignature({
      resumeUrl: "https://example.com/updated-resume.pdf",
      resumePublicId: "resume-public-id",
    });

    expect(firstSignature).toBe(secondSignature);
    expect(firstSignature).not.toBe(changedSignature);
  });

  test("builds resume source from candidate profile resume", async () => {
    const { candidate } = await createCandidateWithResume("source");

    const source = buildCandidateProfileResumeSource(candidate);

    expect(source).toEqual(
      expect.objectContaining({
        candidateUserId: candidate.userId,
        candidateProfileId: candidate._id,
        sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
        resumeUrl: "https://example.com/resumes/test-resume.pdf",
        resumePublicId: "hireflow/resumes/test-resume",
      }),
    );

    expect(source.resumeSignature).toEqual(expect.any(String));
  });

  test("builds resume source from application submitted resume", async () => {
    const { candidate } = await createCandidateWithResume("application");

    const application = {
      candidateUserId: candidate.userId,
      candidateId: candidate._id,
      resumeUrl: "https://example.com/resumes/submitted-resume.pdf",
    };

    const source = buildApplicationResumeSource(application);

    expect(source).toEqual(
      expect.objectContaining({
        candidateUserId: candidate.userId,
        candidateProfileId: candidate._id,
        sourceType: RESUME_ANALYSIS_SOURCE_TYPES.APPLICATION_RESUME,
        resumeUrl: "https://example.com/resumes/submitted-resume.pdf",
        resumePublicId: null,
      }),
    );

    expect(source.resumeSignature).toEqual(expect.any(String));
  });

  test("creates pending resume analysis", async () => {
    const { candidate } = await createCandidateWithResume("pending");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    const analysis = await createPendingResumeAnalysis({
      resumeSource,
      provider: "gemini",
      model: "gemini-test-model",
    });

    expect(analysis).toEqual(
      expect.objectContaining({
        candidateUserId: candidate.userId,
        candidateProfileId: candidate._id,
        sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
        resumeUrl: candidate.resumeUrl,
        resumePublicId: candidate.resumePublicId,
        resumeSignature: resumeSource.resumeSignature,
        status: RESUME_ANALYSIS_STATUS.PENDING,
        provider: "gemini",
        model: "gemini-test-model",
      }),
    );

    expect(await ResumeAnalysis.countDocuments()).toBe(1);
  });

  test("marks resume analysis as completed", async () => {
    const { candidate } = await createCandidateWithResume("completed");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    const pendingAnalysis = await createPendingResumeAnalysis({
      resumeSource,
    });

    const completedAnalysis = await completeResumeAnalysis({
      analysisId: pendingAnalysis._id,
      extracted: {
        fullName: "Test Candidate",
        skills: ["React", "Node.js", "MongoDB"],
        projects: [
          {
            name: "HireFlow",
            technologies: ["React", "Node.js"],
          },
        ],
      },
      evaluation: {
        resumeScore: 78,
        strengths: ["Relevant MERN stack skills"],
        weaknesses: ["Deployment experience is unclear"],
        improvementSuggestions: ["Add deployment details"],
      },
      rawOutput: {
        summary: "Generated by provider",
      },
      provider: "gemini",
      model: "gemini-test-model",
    });

    expect(completedAnalysis.status).toBe(RESUME_ANALYSIS_STATUS.COMPLETED);
    expect(completedAnalysis.analyzedAt).toBeInstanceOf(Date);
    expect(completedAnalysis.extracted.skills).toEqual([
      "React",
      "Node.js",
      "MongoDB",
    ]);
    expect(completedAnalysis.evaluation.resumeScore).toBe(78);
    expect(completedAnalysis.errorMessage).toBeNull();
  });

  test("marks resume analysis as failed", async () => {
    const { candidate } = await createCandidateWithResume("failed");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    const pendingAnalysis = await createPendingResumeAnalysis({
      resumeSource,
    });

    const failedAnalysis = await failResumeAnalysis({
      analysisId: pendingAnalysis._id,
      errorMessage: "Provider timeout",
    });

    expect(failedAnalysis.status).toBe(RESUME_ANALYSIS_STATUS.FAILED);
    expect(failedAnalysis.errorMessage).toBe("Provider timeout");
    expect(failedAnalysis.analyzedAt).toBeInstanceOf(Date);
  });

  test("finds latest completed resume analysis for a matching resume", async () => {
    const { candidate } = await createCandidateWithResume("latest");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    await createPendingResumeAnalysis({
      resumeSource,
    });

    const completed = await createPendingResumeAnalysis({
      resumeSource,
    });

    await completeResumeAnalysis({
      analysisId: completed._id,
      extracted: {
        skills: ["React"],
      },
      evaluation: {
        resumeScore: 80,
      },
    });

    const latestCompleted = await findLatestCompletedResumeAnalysis({
      candidateUserId: candidate.userId,
      sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
      resumeSignature: resumeSource.resumeSignature,
    });

    expect(latestCompleted).not.toBeNull();
    expect(latestCompleted.status).toBe(RESUME_ANALYSIS_STATUS.COMPLETED);
    expect(latestCompleted._id.toString()).toBe(completed._id.toString());
  });

  test("detects whether completed analysis is fresh for resume source", async () => {
    const { candidate } = await createCandidateWithResume("fresh");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    const pending = await createPendingResumeAnalysis({
      resumeSource,
    });

    const completed = await completeResumeAnalysis({
      analysisId: pending._id,
      extracted: {
        skills: ["React"],
      },
      evaluation: {
        resumeScore: 80,
      },
    });

    expect(isResumeAnalysisFreshForSource(completed, resumeSource)).toBe(true);

    const staleSource = {
      ...resumeSource,
      resumeSignature: createResumeSignature({
        resumeUrl: "https://example.com/new-resume.pdf",
        resumePublicId: "hireflow/resumes/new-resume",
      }),
    };

    expect(isResumeAnalysisFreshForSource(completed, staleSource)).toBe(false);
  });

  test("throws when candidate profile has no resume", async () => {
    const { candidate } = await createCandidateWithResume("missing", {
      resumeUrl: null,
      resumePublicId: null,
    });

    expect(() => buildCandidateProfileResumeSource(candidate)).toThrow(
      "Resume file is required",
    );
  });

  test("finds latest analysis regardless of status when status is omitted", async () => {
    const { candidate } = await createCandidateWithResume("any");

    const resumeSource = buildCandidateProfileResumeSource(candidate);

    const analysis = await createPendingResumeAnalysis({
      resumeSource,
    });

    const latest = await findLatestResumeAnalysis({
      candidateUserId: candidate.userId,
      sourceType: RESUME_ANALYSIS_SOURCE_TYPES.CANDIDATE_PROFILE_RESUME,
    });

    expect(latest._id.toString()).toBe(analysis._id.toString());
  });

  test("rejects invalid resume analysis id while completing", async () => {
    await expect(
      completeResumeAnalysis({
        analysisId: new mongoose.Types.ObjectId(),
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Resume analysis not found",
    });
  });
});
