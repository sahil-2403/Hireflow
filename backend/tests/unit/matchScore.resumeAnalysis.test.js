import { describe, expect, test } from "vitest";

import { EXPERIENCE_LEVEL, JOB_STATUS } from "../../src/config/constants.js";

import { calculateJobCandidateMatch } from "../../src/shared/services/matchScore.service.js";

const buildJob = () => ({
  _id: "job-1",
  title: "Junior MERN Developer",
  description: "Build MERN stack applications.",
  requirements: ["React", "Node.js", "MongoDB", "Express.js"],
  skills: ["React", "Node.js", "MongoDB", "Express.js"],
  location: "Pune",
  employmentType: "full-time",
  workplaceType: "hybrid",
  experienceLevel: EXPERIENCE_LEVEL.ENTRY,
  status: JOB_STATUS.OPEN,
});

const buildCandidate = () => ({
  _id: "candidate-1",
  headline: "Junior React Developer",
  summary: "Frontend developer learning backend.",
  skills: ["React"],
  experienceLevel: EXPERIENCE_LEVEL.ENTRY,
  location: "Pune",
  resumeUrl: "https://example.com/resume.pdf",
  linkedinUrl: "https://linkedin.com/in/test",
  githubUrl: "https://github.com/test",
  portfolioUrl: "https://example.com",
  targetJobTitles: ["React Developer"],
  preferredLocations: ["Pune"],
  preferredWorkplaceTypes: ["hybrid"],
  preferredEmploymentTypes: ["full-time"],
});

const buildResumeAnalysis = () => ({
  _id: {
    toString: () => "resume-analysis-1",
  },
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
  },
});

describe("match score with resume analysis", () => {
  test("keeps profile-only match when resume analysis is not provided", () => {
    const match = calculateJobCandidateMatch(buildJob(), buildCandidate(), {
      calculatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(match.matchBasis).toBe("profile");
    expect(match.profileScore).toBe(match.matchScore);
    expect(match.resumeBoost).toBe(0);
    expect(match.resumeEvidence).toEqual([]);
    expect(match.resumeAnalysisId).toBeNull();
  });

  test("uses resume analysis as extra evidence for enhanced match", () => {
    const profileOnlyMatch = calculateJobCandidateMatch(
      buildJob(),
      buildCandidate(),
      {
        calculatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    );

    const enhancedMatch = calculateJobCandidateMatch(
      buildJob(),
      buildCandidate(),
      {
        calculatedAt: new Date("2026-01-01T00:00:00.000Z"),
        resumeAnalysis: buildResumeAnalysis(),
      },
    );

    expect(enhancedMatch.matchBasis).toBe("profile_and_resume");
    expect(enhancedMatch.profileScore).toBe(profileOnlyMatch.matchScore);
    expect(enhancedMatch.resumeBoost).toBeGreaterThan(0);
    expect(enhancedMatch.matchScore).toBeGreaterThan(
      profileOnlyMatch.matchScore,
    );
    expect(enhancedMatch.resumeAnalysisId).toBe("resume-analysis-1");

    expect(enhancedMatch.matchedSkills).toEqual([
      "express.js",
      "mongodb",
      "node.js",
      "react",
    ]);

    expect(enhancedMatch.resumeEvidence.length).toBeGreaterThan(0);
  });

  test("does not lower score when resume analysis adds no useful evidence", () => {
    const candidate = buildCandidate();

    const weakResumeAnalysis = {
      extracted: {
        skills: ["Photoshop"],
        targetRoles: ["Designer"],
        projects: [],
      },
      evaluation: {
        resumeScore: 40,
      },
    };

    const profileOnlyMatch = calculateJobCandidateMatch(buildJob(), candidate);
    const enhancedMatch = calculateJobCandidateMatch(buildJob(), candidate, {
      resumeAnalysis: weakResumeAnalysis,
    });

    expect(enhancedMatch.matchBasis).toBe("profile_and_resume");
    expect(enhancedMatch.matchScore).toBeGreaterThanOrEqual(
      profileOnlyMatch.matchScore,
    );
    expect(enhancedMatch.resumeBoost).toBeGreaterThanOrEqual(0);
  });
});
