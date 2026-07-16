import { AI_FEATURE_KEYS } from "../../config/constants.js";

import { getStaffCompany } from "../../shared/utils/companyAccess.js";

import { consumeAiUsage, getAiUsageState } from "../aiUsage/aiUsage.service.js";

import {
  buildAiSystemInstruction,
  buildJobPostAssistantPrompt,
} from "./aiPrompt.service.js";

import { ensureAiProviderReady, generateAiJson } from "./aiProvider.service.js";

const toStringOrNull = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const normalizeJobPostAssistantOutput = (output, jobDraft) => {
  return {
    improvedTitle:
      toStringOrNull(output?.improvedTitle) || toStringOrNull(jobDraft.title),

    improvedDescription:
      toStringOrNull(output?.improvedDescription) ||
      toStringOrNull(jobDraft.description),

    improvedResponsibilities: toStringArray(output?.improvedResponsibilities),

    improvedRequirements: toStringArray(output?.improvedRequirements),

    recommendedSkills: toStringArray(output?.recommendedSkills),

    qualityNotes: toStringArray(output?.qualityNotes),

    missingInformation: toStringArray(output?.missingInformation),
  };
};

const generateJobPostAssistantSuggestions = async ({
  userId,
  role,
  jobDraft,
}) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to use the AI Job Post Assistant",
  );

  const aiConfig = ensureAiProviderReady();

  const usage = await consumeAiUsage({
    userId,
    companyId: company._id,
    featureKey: AI_FEATURE_KEYS.JOB_POST_SUGGESTION,
  });

  const rawOutput = await generateAiJson({
    prompt: buildJobPostAssistantPrompt({
      company,
      jobDraft,
    }),

    systemInstruction: buildAiSystemInstruction("AI Job Post Assistant"),

    temperature: 0.3,
    maxOutputTokens: 3072,
  });

  const suggestions = normalizeJobPostAssistantOutput(rawOutput, jobDraft);

  return {
    suggestions,
    usage,
    provider: aiConfig.provider,
    model: aiConfig.model,
  };
};

const getJobPostAssistantUsage = async (userId) => {
  return getAiUsageState({
    userId,
    featureKey: AI_FEATURE_KEYS.JOB_POST_SUGGESTION,
  });
};

export {
  generateJobPostAssistantSuggestions,
  getJobPostAssistantUsage,
  normalizeJobPostAssistantOutput,
};
