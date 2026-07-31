import { isIP } from "node:net";

import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const getFirstHeaderValue = (value) => {
  const headerValue = Array.isArray(value) ? value[0] : value;

  return headerValue?.split(",")[0]?.trim();
};

const normalizeIpAddress = (value) => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().replace(/^::ffff:/, "");

  return isIP(normalizedValue) ? normalizedValue : null;
};

const getClientIpAddress = (request) => {
  const isVercelRequest = Boolean(request.headers["x-vercel-id"]);

  if (isVercelRequest) {
    const vercelIp = normalizeIpAddress(
      getFirstHeaderValue(request.headers["x-vercel-forwarded-for"]),
    );

    if (vercelIp) {
      return vercelIp;
    }
  }

  return (
    normalizeIpAddress(request.ip) ||
    normalizeIpAddress(request.socket.remoteAddress)
  );
};

const rateLimitKeyGenerator = (request) => {
  const clientIp = getClientIpAddress(request);

  if (!clientIp) {
    return "unknown-client";
  }

  return ipKeyGenerator(clientIp);
};

const globalLimiter = rateLimit({
  windowMs:
    (Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,

  limit: Number(process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS) || 300,

  keyGenerator: rateLimitKeyGenerator,

  // Render checks this endpoint frequently.
  // Health checks should not consume user quota.
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

  keyGenerator: rateLimitKeyGenerator,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication attempts. Please try again later.",
  },
});

export { globalLimiter, authLimiter };
