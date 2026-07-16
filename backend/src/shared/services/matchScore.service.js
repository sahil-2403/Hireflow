import {
  MATCH_ENGINE_VERSION,
  MATCH_SCORE_WEIGHTS,
  buildCandidateMatchSignature,
  buildJobMatchSignature,
  buildSkillMap,
  calculateTextSimilarity,
  getConfidenceLevel,
  getMatchLabel,
  hasList,
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

const MATCH_BASIS = Object.freeze({
  PROFILE: "profile",
  PROFILE_AND_RESUME: "profile_and_resume",
});

const neutralScore = (maximumScore) => roundToTwo(maximumScore / 2);

const addMessage = (messages, message) => {
  if (message) messages.push(message);
};

const getResumeAnalysisData = (resumeAnalysis) => {
  if (!resumeAnalysis || !isObject(resumeAnalysis)) {
    return null;
  }

  const extracted = resumeAnalysis.extracted || {};
  const evaluation = resumeAnalysis.evaluation || {};

  return {
    extracted,
    evaluation,
  };
};

const collectResumeSkills = (resumeAnalysis) => {
  const data = getResumeAnalysisData(resumeAnalysis);

  if (!data) {
    return [];
  }

  const { extracted } = data;

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

const collectResumeTargetRoles = (resumeAnalysis) => {
  const data = getResumeAnalysisData(resumeAnalysis);

  if (!data) {
    return [];
  }

  return unique(data.extracted.targetRoles || []);
};

const buildResumeEvidence = ({ job, resumeAnalysis, matchedSkills }) => {
  const data = getResumeAnalysisData(resumeAnalysis);

  if (!data) {
    return [];
  }

  const { extracted } = data;
  const evidence = [];

  if (matchedSkills.length > 0) {
    evidence.push(
      `Resume analysis supports ${matchedSkills.length} matched skill${
        matchedSkills.length === 1 ? "" : "s"
      }: ${matchedSkills.slice(0, 5).join(", ")}.`,
    );
  }

  if (Array.isArray(extracted.projects) && extracted.projects.length > 0) {
    const jobSkillKeys = new Set(buildSkillMap(job.skills).keys());

    const relevantProjects = extracted.projects
      .map((project) => {
        const projectSkills = buildSkillMap(project?.technologies || []);

        const overlap = [...projectSkills.keys()].filter((skillKey) =>
          jobSkillKeys.has(skillKey),
        );

        return {
          name: project?.name,
          overlap,
        };
      })
      .filter((project) => project.overlap.length > 0);

    for (const project of relevantProjects.slice(0, 3)) {
      evidence.push(
        project.name
          ? `Resume project "${project.name}" includes technologies relevant to this role.`
          : "One resume project includes technologies relevant to this role.",
      );
    }
  }

  return unique(evidence);
};

const buildEnhancedCandidate = (candidate, resumeAnalysis) => {
  const resumeSkills = collectResumeSkills(resumeAnalysis);
  const resumeTargetRoles = collectResumeTargetRoles(resumeAnalysis);

  if (resumeSkills.length === 0 && resumeTargetRoles.length === 0) {
    return candidate;
  }

  return {
    ...candidate,
    skills: unique([...(candidate.skills || []), ...resumeSkills]),
    targetJobTitles: unique([
      ...(candidate.targetJobTitles || []),
      ...resumeTargetRoles,
    ]),
  };
};

const calculateSkills = (job, candidate, reasons, warnings) => {
  const maxScore = MATCH_SCORE_WEIGHTS.skills;
  const jobSkills = buildSkillMap(job.skills);
  const candidateSkills = buildSkillMap(candidate.skills);

  if (jobSkills.size === 0 || candidateSkills.size === 0) {
    const missingSide = jobSkills.size === 0 ? "job" : "candidate";

    addMessage(
      warnings,
      `The ${missingSide} has no structured skills, so skill overlap could not be verified.`,
    );
    addMessage(
      reasons,
      "Skill overlap was treated as neutral because structured skill data is incomplete.",
    );

    return {
      score: neutralScore(maxScore),
      maxScore,
      requiredSkillCount: jobSkills.size,
      matchedSkillCount: 0,
      matchedSkills: [],
      missingSkills: [],
      extraCandidateSkills:
        jobSkills.size === 0 ? [...candidateSkills.values()].sort() : [],
    };
  }

  const matchedSkills = [];
  const missingSkills = [];

  for (const [key, skill] of jobSkills.entries()) {
    (candidateSkills.has(key) ? matchedSkills : missingSkills).push(skill);
  }

  const extraCandidateSkills = [...candidateSkills.entries()]
    .filter(([key]) => !jobSkills.has(key))
    .map(([, skill]) => skill)
    .sort();

  const score = roundToTwo(maxScore * (matchedSkills.length / jobSkills.size));

  addMessage(
    reasons,
    matchedSkills.length > 0
      ? `${matchedSkills.length} of ${jobSkills.size} listed job skills match the candidate profile.`
      : "No listed job skills currently match the candidate profile.",
  );

  return {
    score,
    maxScore,
    requiredSkillCount: jobSkills.size,
    matchedSkillCount: matchedSkills.length,
    matchedSkills: matchedSkills.sort(),
    missingSkills: missingSkills.sort(),
    extraCandidateSkills,
  };
};

const calculateTitle = (job, candidate, reasons, warnings) => {
  const maxScore = MATCH_SCORE_WEIGHTS.title;
  const targetTitles = Array.isArray(candidate.targetJobTitles)
    ? candidate.targetJobTitles.filter(hasText)
    : [];
  const fallbackSources = [candidate.headline, candidate.summary].filter(
    hasText,
  );
  const sources = targetTitles.length > 0 ? targetTitles : fallbackSources;
  const source =
    targetTitles.length > 0
      ? "candidate-preferences"
      : fallbackSources.length > 0
        ? "profile-fallback"
        : "unavailable";

  if (!hasText(job.title) || sources.length === 0) {
    addMessage(
      warnings,
      "Candidate title data is incomplete, so title matching was treated as neutral.",
    );

    return {
      score: neutralScore(maxScore),
      maxScore,
      similarityPercentage: null,
      source,
    };
  }

  if (source === "profile-fallback") {
    addMessage(
      warnings,
      "Candidate target job titles are missing, so headline and summary were used as fallback data.",
    );
  }

  const similarity = Math.max(
    ...sources.map((value) => calculateTextSimilarity(job.title, value)),
  );

  addMessage(
    reasons,
    similarity >= 0.75
      ? "The job title strongly aligns with the candidate's target role."
      : similarity >= 0.4
        ? "The job title partially aligns with the candidate's target role."
        : "The job title has limited overlap with the candidate's target role.",
  );

  return {
    score: roundToTwo(maxScore * similarity),
    maxScore,
    similarityPercentage: Math.round(similarity * 100),
    source,
  };
};

const calculateExperience = (job, candidate, reasons, warnings) => {
  const maxScore = MATCH_SCORE_WEIGHTS.experience;
  const jobRank = EXPERIENCE_RANK[job.experienceLevel];
  const candidateRank = EXPERIENCE_RANK[candidate.experienceLevel];

  if (jobRank === undefined || candidateRank === undefined) {
    addMessage(
      warnings,
      "Experience data is incomplete, so experience matching was treated as neutral.",
    );

    return {
      score: neutralScore(maxScore),
      maxScore,
      jobExperienceLevel: job.experienceLevel ?? null,
      candidateExperienceLevel: candidate.experienceLevel ?? null,
    };
  }

  const difference = candidateRank - jobRank;
  const score =
    difference >= 0 ? 15 : difference === -1 ? 9 : difference === -2 ? 3 : 0;

  addMessage(
    reasons,
    difference >= 0
      ? "The candidate meets or exceeds the job's experience level."
      : difference === -1
        ? "The candidate is one experience level below the job requirement."
        : "The candidate's experience level is below the job requirement.",
  );

  return {
    score,
    maxScore,
    jobExperienceLevel: job.experienceLevel,
    candidateExperienceLevel: candidate.experienceLevel,
  };
};

const getPrimaryLocation = (value) =>
  hasText(value) ? normalizeMatchText(value.split(",")[0]) : "";

const locationsMatch = (jobLocation, candidateLocation) => {
  const jobValue = normalizeMatchText(jobLocation);
  const candidateValue = normalizeMatchText(candidateLocation);

  return Boolean(
    jobValue &&
    candidateValue &&
    (jobValue === candidateValue ||
      jobValue.includes(candidateValue) ||
      candidateValue.includes(jobValue) ||
      getPrimaryLocation(jobLocation) ===
        getPrimaryLocation(candidateLocation)),
  );
};

const calculateLocation = (job, candidate, reasons, warnings) => {
  const maxScore = MATCH_SCORE_WEIGHTS.location;

  if (job.workplaceType === "remote") {
    addMessage(reasons, "The remote role avoids a direct location mismatch.");

    return {
      score: maxScore,
      maxScore,
      source: "remote-role",
      matchedLocation: job.location ?? null,
    };
  }

  const preferredLocations = Array.isArray(candidate.preferredLocations)
    ? candidate.preferredLocations.filter(hasText)
    : [];
  const fallbackLocations = hasText(candidate.location)
    ? [candidate.location]
    : [];
  const locations =
    preferredLocations.length > 0 ? preferredLocations : fallbackLocations;
  const source =
    preferredLocations.length > 0
      ? "candidate-preferences"
      : fallbackLocations.length > 0
        ? "profile-fallback"
        : "unavailable";

  if (!hasText(job.location) || locations.length === 0) {
    addMessage(
      warnings,
      "Location data is incomplete, so location matching was treated as neutral.",
    );

    return {
      score: neutralScore(maxScore),
      maxScore,
      source,
      matchedLocation: null,
    };
  }

  if (source === "profile-fallback") {
    addMessage(
      warnings,
      "Candidate preferred locations are missing, so profile location was used as fallback data.",
    );
  }

  const matchedLocation =
    locations.find((value) => locationsMatch(job.location, value)) ?? null;

  addMessage(
    reasons,
    matchedLocation
      ? "The job location matches a candidate location preference."
      : "The job location does not match the candidate's listed locations.",
  );

  return {
    score: matchedLocation ? maxScore : 0,
    maxScore,
    source,
    matchedLocation,
  };
};

const calculatePreference = ({
  jobValue,
  candidateValues,
  maxScore,
  label,
  reasons,
  warnings,
}) => {
  if (!hasText(jobValue) || !hasList(candidateValues)) {
    addMessage(
      warnings,
      `${label} data is incomplete, so this category was treated as neutral.`,
    );

    return {
      score: neutralScore(maxScore),
      maxScore,
      matched: null,
    };
  }

  const matched = candidateValues
    .map(normalizeMatchText)
    .includes(normalizeMatchText(jobValue));

  addMessage(
    reasons,
    matched
      ? `The ${label.toLowerCase()} matches the candidate's preference.`
      : `The ${label.toLowerCase()} does not match the candidate's listed preferences.`,
  );

  return {
    score: matched ? maxScore : 0,
    maxScore,
    matched,
  };
};

const calculateConfidenceScore = (job, candidate, resumeAnalysis = null) => {
  const resumeData = getResumeAnalysisData(resumeAnalysis);

  const checks = [
    [6, hasText(job.title)],
    [6, hasText(job.description)],
    [5, hasList(job.requirements)],
    [12, hasList(job.skills)],
    [5, hasText(job.location)],
    [4, hasText(job.employmentType)],
    [4, hasText(job.workplaceType)],
    [5, hasText(job.experienceLevel)],
    [3, hasText(job.status)],
    [5, hasText(candidate.headline)],
    [5, hasText(candidate.summary)],
    [12, hasList(candidate.skills)],
    [5, hasText(candidate.experienceLevel)],
    [5, hasText(candidate.location)],
    [5, hasText(candidate.resumeUrl)],
    [1, hasText(candidate.linkedinUrl)],
    [1, hasText(candidate.githubUrl)],
    [1, hasText(candidate.portfolioUrl)],
    [4, hasList(candidate.targetJobTitles)],
    [2, hasList(candidate.preferredLocations)],
    [2, hasList(candidate.preferredWorkplaceTypes)],
    [2, hasList(candidate.preferredEmploymentTypes)],
  ];

  const baseConfidence = checks.reduce(
    (total, [weight, complete]) => total + (complete ? weight : 0),
    0,
  );

  if (!resumeData) {
    return baseConfidence;
  }

  const resumeBoostChecks = [
    [4, hasList(resumeData.extracted.skills)],
    [2, hasList(resumeData.extracted.projects)],
    [2, hasList(resumeData.extracted.targetRoles)],
    [2, Number.isFinite(Number(resumeData.evaluation.resumeScore))],
  ];

  const resumeConfidenceBoost = resumeBoostChecks.reduce(
    (total, [weight, complete]) => total + (complete ? weight : 0),
    0,
  );

  return Math.min(baseConfidence + resumeConfidenceBoost, 100);
};

const addConfidenceWarnings = (job, candidate, warnings) => {
  if (!hasText(candidate.headline) || !hasText(candidate.summary)) {
    addMessage(
      warnings,
      "Candidate headline or summary is incomplete, which lowers match confidence.",
    );
  }

  if (!hasText(candidate.resumeUrl)) {
    addMessage(
      warnings,
      "Candidate resume data is missing, which lowers match confidence.",
    );
  }

  if (
    !hasText(candidate.linkedinUrl) &&
    !hasText(candidate.githubUrl) &&
    !hasText(candidate.portfolioUrl)
  ) {
    addMessage(
      warnings,
      "Candidate professional links are missing, which lowers match confidence.",
    );
  }

  if (!hasList(job.requirements)) {
    addMessage(
      warnings,
      "The job has no structured requirements, which lowers match confidence.",
    );
  }
};

const calculateProfileOnlyMatch = (job, candidate, calculatedAt) => {
  const reasons = [];
  const warnings = [];

  const skills = calculateSkills(job, candidate, reasons, warnings);
  const title = calculateTitle(job, candidate, reasons, warnings);
  const experience = calculateExperience(job, candidate, reasons, warnings);
  const location = calculateLocation(job, candidate, reasons, warnings);
  const workplaceType = calculatePreference({
    jobValue: job.workplaceType,
    candidateValues: candidate.preferredWorkplaceTypes,
    maxScore: MATCH_SCORE_WEIGHTS.workplaceType,
    label: "Workplace type",
    reasons,
    warnings,
  });
  const employmentType = calculatePreference({
    jobValue: job.employmentType,
    candidateValues: candidate.preferredEmploymentTypes,
    maxScore: MATCH_SCORE_WEIGHTS.employmentType,
    label: "Employment type",
    reasons,
    warnings,
  });

  addConfidenceWarnings(job, candidate, warnings);

  const rawScore =
    skills.score +
    title.score +
    experience.score +
    location.score +
    workplaceType.score +
    employmentType.score;

  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const confidenceScore = calculateConfidenceScore(job, candidate);
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
    reasons: unique(reasons),
    warnings: unique(warnings),
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

  const profileMatch = calculateProfileOnlyMatch(job, candidate, calculatedAt);
  const resumeData = getResumeAnalysisData(resumeAnalysis);

  if (!resumeData) {
    return {
      ...profileMatch,
      matchBasis: MATCH_BASIS.PROFILE,
      profileScore: profileMatch.matchScore,
      resumeBoost: 0,
      resumeEvidence: [],
      resumeAnalysisId: null,
    };
  }

  const enhancedCandidate = buildEnhancedCandidate(candidate, resumeAnalysis);
  const enhancedMatch = calculateProfileOnlyMatch(
    job,
    enhancedCandidate,
    calculatedAt,
  );

  const resumeBoost = Math.max(
    0,
    enhancedMatch.matchScore - profileMatch.matchScore,
  );

  const resumeEvidence = buildResumeEvidence({
    job,
    resumeAnalysis,
    matchedSkills: enhancedMatch.matchedSkills,
  });

  const reasons = unique([
    ...enhancedMatch.reasons,
    ...(resumeBoost > 0
      ? [
          "Stored resume analysis improved the match by adding resume-based skills or target roles.",
        ]
      : [
          "Stored resume analysis was considered, but it did not increase the profile match score.",
        ]),
  ]);

  return {
    ...enhancedMatch,
    matchBasis: MATCH_BASIS.PROFILE_AND_RESUME,
    profileScore: profileMatch.matchScore,
    resumeBoost,
    resumeEvidence,
    resumeAnalysisId: resumeAnalysis._id?.toString?.() || null,
    confidenceScore: calculateConfidenceScore(
      job,
      enhancedCandidate,
      resumeAnalysis,
    ),
    confidenceLevel: getConfidenceLevel(
      calculateConfidenceScore(job, enhancedCandidate, resumeAnalysis),
    ),
    reasons,
  };
};
