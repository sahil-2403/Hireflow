import mongoose from "mongoose";

import { AI_FEATURE_KEYS } from "../../config/constants.js";
import { getAiFeatureDailyLimit } from "../../config/ai.js";
import ApiError from "../../shared/errors/ApiError.js";

import AiUsage from "./aiUsage.model.js";

const AI_LIMIT_REACHED_MESSAGE =
  "Daily AI usage limit reached for this feature. Please try again tomorrow.";

const validAiFeatureKeys = new Set(Object.values(AI_FEATURE_KEYS));

const getUtcDateKey = (date = new Date()) => {
  return date.toISOString().slice(0, 10);
};

const getNextUtcResetAt = (date = new Date()) => {
  const resetAt = new Date(date);

  resetAt.setUTCHours(24, 0, 0, 0);

  return resetAt;
};

const assertValidAiFeatureKey = (featureKey) => {
  if (!validAiFeatureKeys.has(featureKey)) {
    throw new ApiError(400, "Invalid AI feature key");
  }
};

const normalizeObjectId = (value, fieldName) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(value);
};

const buildUsageState = ({ featureKey, limit, used, dateKey, resetAt }) => {
  return {
    featureKey,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    dateKey,
    resetAt: resetAt.toISOString(),
  };
};

const getAiUsageState = async ({ userId, featureKey, date = new Date() }) => {
  assertValidAiFeatureKey(featureKey);

  const userObjectId = normalizeObjectId(userId, "user ID");
  const dateKey = getUtcDateKey(date);
  const limit = getAiFeatureDailyLimit(featureKey);

  const usage = await AiUsage.findOne({
    userId: userObjectId,
    featureKey,
    dateKey,
  }).lean();

  return buildUsageState({
    featureKey,
    limit,
    used: usage?.count || 0,
    dateKey,
    resetAt: getNextUtcResetAt(date),
  });
};

const assertAiUsageAvailable = async ({ userId, featureKey, date }) => {
  const usageState = await getAiUsageState({
    userId,
    featureKey,
    date,
  });

  if (usageState.remaining <= 0) {
    throw new ApiError(429, AI_LIMIT_REACHED_MESSAGE);
  }

  return usageState;
};

const consumeAiUsage = async ({
  userId,
  companyId = null,
  featureKey,
  date = new Date(),
}) => {
  assertValidAiFeatureKey(featureKey);

  const userObjectId = normalizeObjectId(userId, "user ID");
  const companyObjectId = normalizeObjectId(companyId, "company ID");

  const dateKey = getUtcDateKey(date);
  const resetAt = getNextUtcResetAt(date);
  const limit = getAiFeatureDailyLimit(featureKey);

  if (limit <= 0) {
    throw new ApiError(429, AI_LIMIT_REACHED_MESSAGE);
  }

  let usage = await AiUsage.findOne({
    userId: userObjectId,
    featureKey,
    dateKey,
  });

  if (usage && usage.count >= limit) {
    throw new ApiError(429, AI_LIMIT_REACHED_MESSAGE);
  }

  if (!usage) {
    try {
      usage = await AiUsage.create({
        userId: userObjectId,
        companyId: companyObjectId,
        featureKey,
        dateKey,
        count: 1,
        lastUsedAt: new Date(),
      });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      usage = await AiUsage.findOne({
        userId: userObjectId,
        featureKey,
        dateKey,
      });

      if (!usage || usage.count >= limit) {
        throw new ApiError(429, AI_LIMIT_REACHED_MESSAGE);
      }

      usage.count += 1;
      usage.lastUsedAt = new Date();

      if (companyObjectId) {
        usage.companyId = companyObjectId;
      }

      await usage.save();
    }
  } else {
    usage.count += 1;
    usage.lastUsedAt = new Date();

    if (companyObjectId) {
      usage.companyId = companyObjectId;
    }

    await usage.save();
  }

  return buildUsageState({
    featureKey,
    limit,
    used: usage.count,
    dateKey,
    resetAt,
  });
};

export {
  getUtcDateKey,
  getAiUsageState,
  assertAiUsageAvailable,
  consumeAiUsage,
};
