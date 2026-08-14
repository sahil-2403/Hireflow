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
  const value =
    typeof snapshot.toObject === "function" ? snapshot.toObject() : snapshot;

  return {
    matchScore: value.matchScore,
    matchLabel: value.matchLabel,
    confidenceScore: value.confidenceScore,
    confidenceLevel: value.confidenceLevel,
    breakdown: value.breakdown,
    matchedSkills: value.matchedSkills,
    missingSkills: value.missingSkills,
    extraCandidateSkills: value.extraCandidateSkills,
    reasons: value.reasons,
    warnings: value.warnings,
    calculatedAt: value.calculatedAt,
  };
};

export { buildApplicationMatchResponse, createApplicationMatchSnapshot };
