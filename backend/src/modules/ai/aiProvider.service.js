import { getAiConfig } from "../../config/ai.js";
import ApiError from "../../shared/errors/ApiError.js";

const AI_NOT_AVAILABLE_MESSAGE =
  "AI features are currently unavailable. Please try again later.";

const getGeminiConfig = () => {
  const config = getAiConfig();

  if (!config.enabled) {
    throw new ApiError(503, AI_NOT_AVAILABLE_MESSAGE);
  }

  if (!config.model) {
    throw new ApiError(503, "AI model is not configured");
  }

  if (!config.geminiApiKey) {
    throw new ApiError(503, "Gemini API key is not configured");
  }

  return config;
};

const ensureAiProviderReady = () => getGeminiConfig();

const normalizeGeminiModelName = (model) =>
  model.startsWith("models/") ? model : `models/${model}`;

const buildGeminiGenerateContentUrl = ({ baseUrl, model, apiKey }) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const normalizedModel = normalizeGeminiModelName(model);

  return `${normalizedBaseUrl}/${normalizedModel}:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;
};

const buildGeminiRequestBody = ({
  prompt = null,
  parts = null,
  systemInstruction = null,
  responseMimeType = "text/plain",
  responseSchema = null,
  temperature = 0.2,
  maxOutputTokens = 2048,
}) => {
  const body = {
    contents: [
      {
        role: "user",
        parts: parts || [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (responseSchema) {
    body.generationConfig.responseSchema = responseSchema;
  }

  return body;
};

const extractGeminiText = (data) => {
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new ApiError(502, "AI provider returned an empty response");
  }

  return text;
};

const stripJsonCodeFence = (text) =>
  text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

const parseAiJson = (text) => {
  try {
    return JSON.parse(stripJsonCodeFence(text));
  } catch {
    throw new ApiError(502, "AI provider returned invalid JSON");
  }
};

const callGemini = async ({
  prompt = null,
  parts = null,
  systemInstruction = null,
  responseMimeType = "text/plain",
  responseSchema = null,
  temperature = 0.2,
  maxOutputTokens = 2048,
}) => {
  const config = getGeminiConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(
      buildGeminiGenerateContentUrl({
        baseUrl: config.geminiApiBaseUrl,
        model: config.model,
        apiKey: config.geminiApiKey,
      }),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          buildGeminiRequestBody({
            prompt,
            parts,
            systemInstruction,
            responseMimeType,
            responseSchema,
            temperature,
            maxOutputTokens,
          }),
        ),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new ApiError(502, "AI provider request failed");
    }

    return extractGeminiText(await response.json());
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(504, "AI provider request timed out");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "AI provider request failed");
  } finally {
    clearTimeout(timeoutId);
  }
};

const generateAiText = async (options) => callGemini(options);

const generateAiJson = async (options) => {
  const text = await callGemini({
    ...options,
    responseMimeType: "application/json",
  });

  return parseAiJson(text);
};

export {
  ensureAiProviderReady,
  generateAiText,
  generateAiJson,
  buildGeminiGenerateContentUrl,
  buildGeminiRequestBody,
  extractGeminiText,
  parseAiJson,
};
