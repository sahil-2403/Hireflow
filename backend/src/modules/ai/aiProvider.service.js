import { getAiConfig } from "../../config/ai.js";
import ApiError from "../../shared/errors/ApiError.js";

const AI_NOT_AVAILABLE_MESSAGE =
  "AI features are currently unavailable. Please try again later.";

const GEMINI_PROVIDER = "gemini";

const assertAiReady = () => {
  const config = getAiConfig();

  if (!config.enabled) {
    throw new ApiError(503, AI_NOT_AVAILABLE_MESSAGE);
  }

  if (config.provider !== GEMINI_PROVIDER) {
    throw new ApiError(503, "Configured AI provider is not supported");
  }

  if (!config.model) {
    throw new ApiError(503, "AI model is not configured");
  }

  if (!config.geminiApiKey) {
    throw new ApiError(503, "Gemini API key is not configured");
  }

  if (typeof fetch !== "function") {
    throw new ApiError(503, "Fetch API is not available in this Node runtime");
  }

  return config;
};

const ensureAiProviderReady = () => {
  return assertAiReady();
};

const normalizeGeminiModelName = (model) => {
  if (model.startsWith("models/")) {
    return model;
  }

  return `models/${model}`;
};

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
  systemInstruction,
  responseMimeType = "application/json",
  responseSchema = null,
  temperature = 0.2,
  maxOutputTokens = 2048,
}) => {
  const contentParts = parts || [
    {
      text: prompt,
    },
  ];

  const body = {
    contents: [
      {
        role: "user",
        parts: contentParts,
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
      parts: [
        {
          text: systemInstruction,
        },
      ],
    };
  }

  if (responseSchema) {
    body.generationConfig.responseSchema = responseSchema;
  }

  return body;
};

const readProviderError = async (response) => {
  try {
    const data = await response.json();

    return (
      data?.error?.message || data?.message || "AI provider request failed"
    );
  } catch {
    return "AI provider request failed";
  }
};

const extractGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];

  const text = parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new ApiError(502, "AI provider returned an empty response");
  }

  return text;
};

const stripJsonCodeFence = (text) => {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
};

const parseAiJson = (text) => {
  try {
    return JSON.parse(stripJsonCodeFence(text));
  } catch {
    throw new ApiError(502, "AI provider returned invalid JSON");
  }
};

const generateAiText = async ({
  prompt = null,
  parts = null,
  systemInstruction = null,
  responseMimeType = "text/plain",
  responseSchema = null,
  temperature = 0.2,
  maxOutputTokens = 2048,
}) => {
  const config = assertAiReady();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.requestTimeoutMs);

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
      await readProviderError(response);

      throw new ApiError(502, "AI provider request failed");
    }

    const data = await response.json();

    return extractGeminiText(data);
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

const generateAiJson = async ({
  prompt = null,
  parts = null,
  systemInstruction = null,
  responseSchema = null,
  temperature = 0.2,
  maxOutputTokens = 2048,
}) => {
  const text = await generateAiText({
    prompt,
    parts,
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema,
    temperature,
    maxOutputTokens,
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
