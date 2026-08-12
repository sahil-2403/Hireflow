import { rateLimit } from "express-rate-limit";

const globalLimiter = rateLimit({
  windowMs:
    (Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,

  limit: Number(process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS) || 300,

  // Health checks are called frequently by the hosting platform and
  // should not consume normal API request quota.
  skip: (request) => request.path === "/api/v1/health",

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs:
    (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,

  limit: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 30,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication attempts. Please try again later.",
  },
});

export { globalLimiter, authLimiter };
