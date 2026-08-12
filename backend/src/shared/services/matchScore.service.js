import {
  MATCH_ENGINE_VERSION,
  MATCH_SCORE_WEIGHTS,
  buildCandidateMatchSignature,
  buildJobMatchSignature,
  buildSkillMap,
  calculateTextSimilarity,
  getConfidenceLevel,
  getMatchLabel,
  hasText,
  isObject,
  normalizeMatchText,
  roundToTwo,
  unique,
} from "../utils/matchScore.utils.js";

export {
  MATCH_ENGINE_VERSION,
  MATCH_SCORE_WEIGHTS,
  buildCandidateMatchSignature,
  buildJobMatchSignature,
  getConfidenceLevel,
  getMatchLabel,
};

const EXPERIENCE_RANK = Object.freeze({
  entry: 0,
  mid: 1,
  senior: 2,
  lead: 3,
});

const collectResumeSkills = (resumeAnalysis) => {
  const extracted = resumeAnalysis?.extracted;

  if (!extracted) {
    return [];
  }

  const projectTechnologies = Array.isArray(extracted.projects)
    ? extracted.projects.flatMap((project) => project?.technologies || [])
    : [];

  return unique([
    ...(extracted.skills || []),
    ...(extracted.programmingLanguages || []),
    ...(extracted.frameworks || []),
    ...(extracted.databases || []),
    ...(extracted.tools || []),
    ...projectTechnologies,
  ]);
};

const buildCandidateWithResume = (candidate, resumeAnalysis) => ({
  ...candidate,
  skills: unique([...(candidate.skills || []), ...collectResumeSkills(resumeAnalysis)]),
  targetJobTitles: unique([
    ...(candidate.targetJobTitles || []),
    ...(resumeAnalysis?.extracted?.targetRoles || []),
  ]),
});

const calculateSkills = (job, candidate) => {
  const jobSkills = buildSkillMap(job.skills);
  const candidateSkills = buildSkillMap(candidate.skills);
  const matchedSkills = [];
  const missingSkills = [];

  for (const [key, skill] of jobSkills.entries()) {
    (candidateSkills.has(key) ? matchedSkills : missingSkills).push(skill);
  }

  const extraCandidateSkills = [...candidateSkills.entries()]
    .filter(([key]) => !jobSkills.has(key))
    .map(([, skill]) => skill)
    .sort();

  const score =
    jobSkills.size === 0
      ? 0
      : roundToTwo(
          MATCH_SCORE_WEIGHTS.skills * (matchedSkills.length / jobSkills.size),
        );

  return {
    score,
    maxScore: MATCH_SCORE_WEIGHTS.skills,
    requiredSkillCount: jobSkills.size,
    matchedSkillCount: matchedSkills.length,
    matchedSkills: matchedSkills.sort(),
    missingSkills: missingSkills.sort(),
    extraCandidateSkills,
  };
};

const calculateTitle = (job, candidate) => {
  const titles = Array.isArray(candidate.targetJobTitles)
    ? candidate.targetJobTitles.filter(hasText)
    : [];

  if (titles.length === 0 && hasText(candidate.headline)) {
    titles.push(candidate.headline);
  }

  const similarity =
    hasText(job.title) && titles.length > 0
      ? Math.max(...titles.map((title) => calculateTextSimilarity(job.title, title)))
      : 0;

  return {
    score: roundToTwo(MATCH_SCORE_WEIGHTS.title * similarity),
    maxScore: MATCH_SCORE_WEIGHTS.title,
    similarityPercentage: Math.round(similarity * 100),
  };
};

const calculateExperience = (job, candidate) => {
  const jobRank = EXPERIENCE_RANK[job.experienceLevel];
  const candidateRank = EXPERIENCE_RANK[candidate.experienceLevel];
  let ratio = 0;

  if (jobRank !== undefined && candidateRank !== undefined) {
    const difference = candidateRank - jobRank;
    ratio = difference >= 0 ? 1 : difference === -1 ? 0.6 : difference === -2 ? 0.2 : 0;
  }

  return {
    score: roundToTwo(MATCH_SCORE_WEIGHTS.experience * ratio),
    maxScore: MATCH_SCORE_WEIGHTS.experience,
    jobExperienceLevel: job.experienceLevel ?? null,
    candidateExperienceLevel: candidate.experienceLevel ?? null,
  };
};

const locationMatches = (jobLocation, candidateLocation) => {
  const jobValue = normalizeMatchText(jobLocation);
  const candidateValue = normalizeMatchText(candidateLocation);

  return Boolean(
    jobValue &&
      candidateValue &&
      (jobValue === candidateValue ||
        jobValue.includes(candidateValue) ||
        candidateValue.includes(jobValue)),
  );
};

const calculateLocation = (job, candidate) => {
  if (job.workplaceType === "remote") {
    return {
      score: MATCH_SCORE_WEIGHTS.location,
      maxScore: MATCH_SCORE_WEIGHTS.location,
      matchedLocation: job.location ?? null,
    };
  }

  const candidateLocations = unique([
    ...(candidate.preferredLocations || []),
    candidate.location,
  ]);

  const matchedLocation =
    candidateLocations.find((location) =>
      locationMatches(job.location, location),
    ) || null;

  return {
    score: matchedLocation ? MATCH_SCORE_WEIGHTS.location : 0,
    maxScore: MATCH_SCORE_WEIGHTS.location,
    matchedLocation,
  };
};

const calculatePreference = (jobValue, candidateValues, maxScore) => {
  const normalizedJobValue = normalizeMatchText(jobValue);
  const normalizedCandidateValues = (candidateValues || []).map(normalizeMatchText);
  const matched = Boolean(
    normalizedJobValue && normalizedCandidateValues.includes(normalizedJobValue),
  );

  return {
    score: matched ? maxScore : 0,
    maxScore,
    matched,
  };
};

const calculateConfidence = (job, candidate) => {
  const checks = [
    hasText(job.title),
    Array.isArray(job.skills) && job.skills.length > 0,
    hasText(job.experienceLevel),
    hasText(job.location),
    hasText(candidate.headline),
    Array.isArray(candidate.skills) && candidate.skills.length > 0,
    hasText(candidate.experienceLevel),
    hasText(candidate.location),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const buildReasons = ({ skills, title, experience, location }) => {
  const reasons = [];

  reasons.push(
    skills.requiredSkillCount > 0
      ? `${skills.matchedSkillCount} of ${skills.requiredSkillCount} required skills match.`
      : "The job does not list structured skills.",
  );

  if (title.similarityPercentage >= 70) {
    reasons.push("The candidate's target role is close to the job title.");
  }

  if (experience.score === experience.maxScore) {
    reasons.push("The candidate meets the required experience level.");
  }

  if (location.score === location.maxScore) {
    reasons.push("The candidate's location preference matches the role.");
  }

  return reasons;
};

const calculateProfileMatch = (job, candidate, calculatedAt) => {
  const skills = calculateSkills(job, candidate);
  const title = calculateTitle(job, candidate);
  const experience = calculateExperience(job, candidate);
  const location = calculateLocation(job, candidate);
  const workplaceType = calculatePreference(
    job.workplaceType,
    candidate.preferredWorkplaceTypes,
    MATCH_SCORE_WEIGHTS.workplaceType,
  );
  const employmentType = calculatePreference(
    job.employmentType,
    candidate.preferredEmploymentTypes,
    MATCH_SCORE_WEIGHTS.employmentType,
  );

  const matchScore = Math.round(
    skills.score +
      title.score +
      experience.score +
      location.score +
      workplaceType.score +
      employmentType.score,
  );

  const confidenceScore = calculateConfidence(job, candidate);
  const timestamp = new Date(calculatedAt);

  if (Number.isNaN(timestamp.getTime())) {
    throw new TypeError("calculatedAt must be a valid Date or date value");
  }

  return {
    matchScore,
    matchLabel: getMatchLabel(matchScore),
    confidenceScore,
    confidenceLevel: getConfidenceLevel(confidenceScore),
    breakdown: {
      skills: {
        score: skills.score,
        maxScore: skills.maxScore,
        requiredSkillCount: skills.requiredSkillCount,
        matchedSkillCount: skills.matchedSkillCount,
      },
      title,
      experience,
      location,
      workplaceType,
      employmentType,
    },
    matchedSkills: skills.matchedSkills,
    missingSkills: skills.missingSkills,
    extraCandidateSkills: skills.extraCandidateSkills,
    reasons: buildReasons({ skills, title, experience, location }),
    warnings: [],
    jobSignature: buildJobMatchSignature(job),
    candidateSignature: buildCandidateMatchSignature(candidate),
    engineVersion: MATCH_ENGINE_VERSION,
    calculatedAt: timestamp,
  };
};

export const calculateJobCandidateMatch = (
  job,
  candidate,
  { calculatedAt = new Date(), resumeAnalysis = null } = {},
) => {
  if (!isObject(job)) {
    throw new TypeError("calculateJobCandidateMatch requires a job object");
  }

  if (!isObject(candidate)) {
    throw new TypeError(
      "calculateJobCandidateMatch requires a candidate object",
    );
  }

  const profileMatch = calculateProfileMatch(job, candidate, calculatedAt);

  if (!resumeAnalysis?.extracted) {
    return {
      ...profileMatch,
      matchBasis: "profile",
      profileScore: profileMatch.matchScore,
      resumeBoost: 0,
      resumeEvidence: [],
      resumeAnalysisId: null,
    };
  }

  const enhancedCandidate = buildCandidateWithResume(candidate, resumeAnalysis);
  const enhancedMatch = calculateProfileMatch(job, enhancedCandidate, calculatedAt);
  const resumeBoost = Math.max(
    0,
    enhancedMatch.matchScore - profileMatch.matchScore,
  );

  return {
    ...enhancedMatch,
    matchBasis: "profile_and_resume",
    profileScore: profileMatch.matchScore,
    resumeBoost,
    resumeEvidence:
      resumeBoost > 0
        ? ["Stored resume skills or target roles improved this match."]
        : [],
    resumeAnalysisId: resumeAnalysis._id?.toString?.() || null,
  };
};
