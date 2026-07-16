import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import ApiError from "../../src/shared/errors/ApiError.js";

import {
  buildGeminiGenerateContentUrl,
  buildGeminiRequestBody,
  extractGeminiText,
  generateAiJson,
  parseAiJson,
} from "../../src/modules/ai/aiProvider.service.js";

describe("AI provider service", () => {
  const originalEnv = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_BASE_URL: process.env.GEMINI_API_BASE_URL,
    AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
  };

  beforeEach(() => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "gemini";
    process.env.AI_MODEL = "gemini-test-model";
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_API_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta";
    process.env.AI_REQUEST_TIMEOUT_MS = "30000";
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    process.env.AI_ENABLED = originalEnv.AI_ENABLED;
    process.env.AI_PROVIDER = originalEnv.AI_PROVIDER;
    process.env.AI_MODEL = originalEnv.AI_MODEL;
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_API_BASE_URL = originalEnv.GEMINI_API_BASE_URL;
    process.env.AI_REQUEST_TIMEOUT_MS = originalEnv.AI_REQUEST_TIMEOUT_MS;
  });

  test("builds Gemini generateContent URL", () => {
    const url = buildGeminiGenerateContentUrl({
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-test-model",
      apiKey: "abc123",
    });

    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent?key=abc123",
    );
  });

  test("builds Gemini request body with JSON response config", () => {
    const body = buildGeminiRequestBody({
      prompt: "Return JSON",
      systemInstruction: "You are a test assistant",
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
          },
        },
        required: ["summary"],
      },
    });

    expect(body.contents[0].parts[0].text).toBe("Return JSON");
    expect(body.systemInstruction.parts[0].text).toBe(
      "You are a test assistant",
    );
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual(
      expect.objectContaining({
        type: "object",
      }),
    );
  });

  test("extracts text from Gemini response", () => {
    const text = extractGeminiText({
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Hello",
              },
              {
                text: "world",
              },
            ],
          },
        },
      ],
    });

    expect(text).toBe("Hello\nworld");
  });

  test("parses JSON even when wrapped in code fences", () => {
    const result = parseAiJson('```json\n{"summary":"ok"}\n```');

    expect(result).toEqual({
      summary: "ok",
    });
  });

  test("generates parsed JSON from Gemini response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"summary":"Generated successfully"}',
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAiJson({
      prompt: "Generate summary",
      systemInstruction: "Return JSON only",
    });

    expect(result).toEqual({
      summary: "Generated successfully",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toContain(
      "/models/gemini-test-model:generateContent?key=test-api-key",
    );

    expect(JSON.parse(options.body)).toEqual(
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          responseMimeType: "application/json",
        }),
      }),
    );
  });

  test("throws 503 when AI is disabled", async () => {
    process.env.AI_ENABLED = "false";

    await expect(
      generateAiJson({
        prompt: "Generate summary",
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: "AI features are currently unavailable. Please try again later.",
    });
  });

  test("throws 503 when Gemini API key is missing", async () => {
    process.env.GEMINI_API_KEY = "";

    await expect(
      generateAiJson({
        prompt: "Generate summary",
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: "Gemini API key is not configured",
    });
  });

  test("throws 502 when provider returns non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: "Rate limit exceeded",
          },
        }),
      }),
    );

    await expect(
      generateAiJson({
        prompt: "Generate summary",
      }),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "AI provider request failed",
    });
  });

  test("throws 502 when provider returns invalid JSON text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "not json",
                  },
                ],
              },
            },
          ],
        }),
      }),
    );

    await expect(
      generateAiJson({
        prompt: "Generate summary",
      }),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "AI provider returned invalid JSON",
    });
  });

  test("throws ApiError when Gemini response is empty", () => {
    expect(() =>
      extractGeminiText({
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      }),
    ).toThrow(ApiError);
  });
});
