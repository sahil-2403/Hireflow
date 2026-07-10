import {
  MATCH_ENGINE_VERSION,
  buildCandidateMatchSignature,
  buildJobMatchSignature,
  calculateJobCandidateMatch,
} from "../../shared/services/matchScore.service.js";

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
    engineVersion: result.engineVersion,
    jobSignature: result.jobSignature,
    candidateSignature: result.candidateSignature,
    calculatedAt: result.calculatedAt,
  };
};

const isApplicationMatchSnapshotCurrent = (snapshot, job, candidate) => {
  if (!snapshot) {
    return false;
  }

  return (
    snapshot.engineVersion === MATCH_ENGINE_VERSION &&
    snapshot.jobSignature === buildJobMatchSignature(job) &&
    snapshot.candidateSignature === buildCandidateMatchSignature(candidate)
  );
};

const shouldRefreshApplicationMatchSnapshot = (snapshot, job, candidate) => {
  return !isApplicationMatchSnapshotCurrent(snapshot, job, candidate);
};

export {
  createApplicationMatchSnapshot,
  isApplicationMatchSnapshotCurrent,
  shouldRefreshApplicationMatchSnapshot,
};
