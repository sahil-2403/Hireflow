import { AI_FEATURE_KEYS } from "./constants.js";

const getBooleanEnv = (key, fallback = false) => {
  const value = process.env[key];

  if (value === undefined) {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
};

const getNumberEnv = (key, fallback) => {
  const value = Number(process.env[key]);

  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
};

const getAiFeatureDailyLimits = () => {
  return {
    [AI_FEATURE_KEYS.RESUME_ANALYSIS]: getNumberEnv(
      "AI_RESUME_ANALYSIS_DAILY_LIMIT",
      1,
    ),

    [AI_FEATURE_KEYS.JOB_RESUME_FIT]: getNumberEnv(
      "AI_JOB_RESUME_FIT_DAILY_LIMIT",
      3,
    ),

    [AI_FEATURE_KEYS.COMPANY_RESUME_REVIEW]: getNumberEnv(
      "AI_COMPANY_RESUME_REVIEW_DAILY_LIMIT",
      10,
    ),

    [AI_FEATURE_KEYS.JOB_POST_SUGGESTION]: getNumberEnv(
      "AI_JOB_POST_SUGGESTION_DAILY_LIMIT",
      5,
    ),

    [AI_FEATURE_KEYS.INTERVIEW_KIT]: getNumberEnv(
      "AI_INTERVIEW_KIT_DAILY_LIMIT",
      10,
    ),

    [AI_FEATURE_KEYS.SHORTLIST]: getNumberEnv("AI_SHORTLIST_DAILY_LIMIT", 3),

    [AI_FEATURE_KEYS.CANDIDATE_COMPARISON]: getNumberEnv(
      "AI_CANDIDATE_COMPARISON_DAILY_LIMIT",
      5,
    ),
  };
};

const getAiFeatureDailyLimit = (featureKey) => {
  return getAiFeatureDailyLimits()[featureKey] ?? 0;
};

const getAiConfig = () => {
  return {
    enabled: getBooleanEnv("AI_ENABLED", false),
    provider: process.env.AI_PROVIDER || "gemini",
    model: process.env.AI_MODEL || null,
    requestTimeoutMs: getNumberEnv("AI_REQUEST_TIMEOUT_MS", 30000),
    maxShortlistCandidates: getNumberEnv("AI_MAX_SHORTLIST_CANDIDATES", 10),
    maxComparisonCandidates: getNumberEnv("AI_MAX_COMPARISON_CANDIDATES", 3),
    featureDailyLimits: getAiFeatureDailyLimits(),
  };
};

export { getAiConfig, getAiFeatureDailyLimit };
