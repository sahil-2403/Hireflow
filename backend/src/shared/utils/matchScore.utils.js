import crypto from "crypto";

export const MATCH_ENGINE_VERSION = "1.0.0";

export const MATCH_SCORE_WEIGHTS = Object.freeze({
  skills: 50,
  title: 15,
  experience: 15,
  location: 10,
  workplaceType: 5,
  employmentType: 5,
});

const SKILL_ALIASES = Object.freeze({
  js: "javascript",
  node: "nodejs",
  reactjs: "react",
  expressjs: "express",
  mongo: "mongodb",
  postgres: "postgresql",
  ts: "typescript",
});

export const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const hasList = (value) => Array.isArray(value) && value.length > 0;

export const roundToTwo = (value) => Math.round(value * 100) / 100;

export const unique = (values) => [...new Set(values.filter(Boolean))];

export const normalizeMatchText = (value) => {
  if (!hasText(value)) {
    return "";
  }

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeSkillKey = (value) => {
  if (!hasText(value)) {
    return "";
  }

  const key = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/c\+\+/g, " cpp ")
    .replace(/c#/g, " csharp ")
    .replace(/\.net/g, " dotnet ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

  return SKILL_ALIASES[key] ?? key;
};

export const buildSkillMap = (skills) => {
  const skillMap = new Map();

  for (const skill of Array.isArray(skills) ? skills : []) {
    const key = normalizeSkillKey(skill);

    if (!key || skillMap.has(key)) {
      continue;
    }

    skillMap.set(key, skill.toLowerCase().replace(/\s+/g, " ").trim());
  }

  return skillMap;
};

const tokenize = (value) => {
  const normalized = normalizeMatchText(value);
  return normalized ? unique(normalized.split(" ")) : [];
};

export const calculateTextSimilarity = (leftValue, rightValue) => {
  const left = normalizeMatchText(leftValue);
  const right = normalizeMatchText(rightValue);

  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return 0.95;
  }

  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const rightTokenSet = new Set(rightTokens);
  const intersectionCount = leftTokens.filter((token) =>
    rightTokenSet.has(token),
  ).length;

  if (intersectionCount === 0) {
    return 0;
  }

  const coverage =
    intersectionCount / Math.min(leftTokens.length, rightTokens.length);
  const unionCount = new Set([...leftTokens, ...rightTokens]).size;
  const jaccard = intersectionCount / unionCount;

  return Math.min(1, roundToTwo(coverage * 0.7 + jaccard * 0.3));
};

const normalizeTextArray = (values, normalizer = normalizeMatchText) =>
  unique(
    (Array.isArray(values) ? values : [])
      .map((value) => normalizer(value))
      .filter(Boolean),
  ).sort();

const normalizeUrl = (value) => (hasText(value) ? value.trim() : null);

const removeEmptyValues = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === null || value === undefined || value === "") {
        return false;
      }

      return !Array.isArray(value) || value.length > 0;
    }),
  );

const hashNormalizedObject = (object) =>
  crypto.createHash("sha256").update(JSON.stringify(object)).digest("hex");

export const buildJobMatchSignature = (job) => {
  if (!isObject(job)) {
    throw new TypeError("buildJobMatchSignature requires a job object");
  }

  return hashNormalizedObject(
    removeEmptyValues({
      title: normalizeMatchText(job.title),
      description: normalizeMatchText(job.description),
      requirements: normalizeTextArray(job.requirements),
      skills: normalizeTextArray(job.skills, normalizeSkillKey),
      location: normalizeMatchText(job.location),
      employmentType: normalizeMatchText(job.employmentType),
      workplaceType: normalizeMatchText(job.workplaceType),
      experienceLevel: normalizeMatchText(job.experienceLevel),
      status: normalizeMatchText(job.status),
    }),
  );
};

export const buildCandidateMatchSignature = (candidate) => {
  if (!isObject(candidate)) {
    throw new TypeError(
      "buildCandidateMatchSignature requires a candidate object",
    );
  }

  return hashNormalizedObject(
    removeEmptyValues({
      headline: normalizeMatchText(candidate.headline),
      summary: normalizeMatchText(candidate.summary),
      skills: normalizeTextArray(candidate.skills, normalizeSkillKey),
      experienceLevel: normalizeMatchText(candidate.experienceLevel),
      location: normalizeMatchText(candidate.location),
      resumeUrl: normalizeUrl(candidate.resumeUrl),
      linkedinUrl: normalizeUrl(candidate.linkedinUrl),
      githubUrl: normalizeUrl(candidate.githubUrl),
      portfolioUrl: normalizeUrl(candidate.portfolioUrl),
      targetJobTitles: normalizeTextArray(candidate.targetJobTitles),
      preferredLocations: normalizeTextArray(candidate.preferredLocations),
      preferredWorkplaceTypes: normalizeTextArray(
        candidate.preferredWorkplaceTypes,
      ),
      preferredEmploymentTypes: normalizeTextArray(
        candidate.preferredEmploymentTypes,
      ),
    }),
  );
};

const clampScore = (score) => {
  const numericScore = Number(score);
  return Number.isFinite(numericScore)
    ? Math.max(0, Math.min(100, numericScore))
    : 0;
};

export const getMatchLabel = (score) => {
  const normalizedScore = clampScore(score);

  if (normalizedScore >= 90) return "Excellent match";
  if (normalizedScore >= 75) return "Strong match";
  if (normalizedScore >= 60) return "Good match";
  if (normalizedScore >= 40) return "Partial match";
  return "Weak match";
};

export const getConfidenceLevel = (score) => {
  const normalizedScore = clampScore(score);

  if (normalizedScore >= 80) return "High";
  if (normalizedScore >= 50) return "Medium";
  return "Low";
};
