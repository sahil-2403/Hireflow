import { calculateJobCandidateMatch } from "../../shared/services/matchScore.service.js";

const createApplicationMatchSnapshot = (job, candidate, options = {}) => {
  const result = calculateJobCandidateMatch(job, candidate, options);

  return {
    matchScore: result.matchScore,
    matchLabel: result.matchLabel,
    confidenceScore: result.confidenceScore,
    confidenceLevel: result.confidenceLevel,
    breakdown: result.breakdown,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    extraCandidateSkills: result.extraCandidateSkills,
    reasons: result.reasons,
    warnings: result.warnings,
    calculatedAt: result.calculatedAt,
  };
};

const buildApplicationMatchResponse = (snapshot) => {
  if (!snapshot) {
    return null;
  }

  const value =
    typeof snapshot.toObject === "function" ? snapshot.toObject() : snapshot;

  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    matchScore: value.matchScore ?? null,
    matchLabel: value.matchLabel ?? null,
    confidenceScore: value.confidenceScore ?? null,
    confidenceLevel: value.confidenceLevel ?? null,
    breakdown: value.breakdown ?? {},
    matchedSkills: Array.isArray(value.matchedSkills)
      ? value.matchedSkills
      : [],
    missingSkills: Array.isArray(value.missingSkills)
      ? value.missingSkills
      : [],
    extraCandidateSkills: Array.isArray(value.extraCandidateSkills)
      ? value.extraCandidateSkills
      : [],
    reasons: Array.isArray(value.reasons) ? value.reasons : [],
    warnings: Array.isArray(value.warnings) ? value.warnings : [],
    calculatedAt: value.calculatedAt ?? null,
  };
};

export { buildApplicationMatchResponse, createApplicationMatchSnapshot };
