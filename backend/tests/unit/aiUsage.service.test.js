import mongoose from "mongoose";

import { AI_FEATURE_KEYS } from "../../src/config/constants.js";
import ApiError from "../../src/shared/errors/ApiError.js";
import AiUsage from "../../src/modules/aiUsage/aiUsage.model.js";

import {
  consumeAiUsage,
  getAiUsageState,
  getUtcDateKey,
} from "../../src/modules/aiUsage/aiUsage.service.js";

describe("AI usage service", () => {
  test("returns empty usage state for a feature", async () => {
    const userId = new mongoose.Types.ObjectId();

    const usage = await getAiUsageState({
      userId,
      featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
    });

    expect(usage).toEqual(
      expect.objectContaining({
        featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
        limit: 1,
        used: 0,
        remaining: 1,
        dateKey: getUtcDateKey(),
      }),
    );

    expect(usage.resetAt).toEqual(expect.any(String));
  });

  test("consumes one usage count for a feature", async () => {
    const userId = new mongoose.Types.ObjectId();

    const usage = await consumeAiUsage({
      userId,
      featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
    });

    expect(usage).toEqual(
      expect.objectContaining({
        featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
        limit: 3,
        used: 1,
        remaining: 2,
      }),
    );

    const savedUsage = await AiUsage.findOne({
      userId,
      featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
      dateKey: getUtcDateKey(),
    });

    expect(savedUsage).not.toBeNull();
    expect(savedUsage.count).toBe(1);
  });

  test("blocks usage when daily limit is reached", async () => {
    const userId = new mongoose.Types.ObjectId();

    await consumeAiUsage({
      userId,
      featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
    });

    await expect(
      consumeAiUsage({
        userId,
        featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
      }),
    ).rejects.toMatchObject({
      statusCode: 429,
      message:
        "Daily AI usage limit reached for this feature. Please try again tomorrow.",
    });
  });

  test("tracks each AI feature separately", async () => {
    const userId = new mongoose.Types.ObjectId();

    await consumeAiUsage({
      userId,
      featureKey: AI_FEATURE_KEYS.RESUME_ANALYSIS,
    });

    const jobFitUsage = await consumeAiUsage({
      userId,
      featureKey: AI_FEATURE_KEYS.JOB_RESUME_FIT,
    });

    expect(jobFitUsage.used).toBe(1);
    expect(jobFitUsage.remaining).toBe(2);

    const totalUsageRows = await AiUsage.countDocuments({
      userId,
    });

    expect(totalUsageRows).toBe(2);
  });

  test("rejects invalid AI feature key", async () => {
    const userId = new mongoose.Types.ObjectId();

    await expect(
      consumeAiUsage({
        userId,
        featureKey: "invalid_feature",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
