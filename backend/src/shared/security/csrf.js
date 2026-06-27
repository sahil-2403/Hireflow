import crypto from "crypto";

import ApiError from "../errors/ApiError.js";

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "hireflow_csrf_token";

const CSRF_COOKIE_MAX_AGE_MINUTES =
  Number(process.env.CSRF_COOKIE_MAX_AGE_MINUTES) || 60;

const CSRF_HEADER_NAME = "x-csrf-token";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const getCsrfCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.AUTH_COOKIE_SAME_SITE || "lax",
    path: "/api/v1",
    maxAge: CSRF_COOKIE_MAX_AGE_MINUTES * 60 * 1000,
  };
};

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const setCsrfCookie = (res, csrfToken) => {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
};

const isSafeMethod = (method) => {
  return !UNSAFE_METHODS.has(method);
};

const isCsrfTokenRoute = (req) => {
  return (
    req.method === "GET" &&
    req.originalUrl.startsWith("/api/v1/auth/csrf-token")
  );
};

const areTokensEqual = (tokenA, tokenB) => {
  if (!tokenA || !tokenB) {
    return false;
  }

  const tokenABuffer = Buffer.from(tokenA);
  const tokenBBuffer = Buffer.from(tokenB);

  if (tokenABuffer.length !== tokenBBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenABuffer, tokenBBuffer);
};

const csrfProtection = (req, res, next) => {
  if (isSafeMethod(req.method) || isCsrfTokenRoute(req)) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.get(CSRF_HEADER_NAME);

  if (!areTokensEqual(csrfCookie, csrfHeader)) {
    throw new ApiError(403, "Invalid CSRF token");
  }

  next();
};

export { csrfProtection, generateCsrfToken, setCsrfCookie };
