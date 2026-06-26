const ACCESS_TOKEN_COOKIE_NAME =
  process.env.ACCESS_TOKEN_COOKIE_NAME || "hireflow_access_token";

const REFRESH_TOKEN_COOKIE_NAME =
  process.env.REFRESH_TOKEN_COOKIE_NAME || "hireflow_refresh_token";

const ACCESS_TOKEN_COOKIE_MAX_AGE_MINUTES =
  Number(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_MINUTES) || 15;

const REFRESH_TOKEN_COOKIE_MAX_AGE_DAYS =
  Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_DAYS) || 7;

const getAuthCookieSameSite = () => {
  return process.env.AUTH_COOKIE_SAME_SITE || "lax";
};

const getBaseCookieOptions = (path) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: getAuthCookieSameSite(),
    path,
  };
};

const getAccessTokenCookieOptions = () => {
  return {
    ...getBaseCookieOptions("/api/v1"),
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MINUTES * 60 * 1000,
  };
};

const getRefreshTokenCookieOptions = () => {
  return {
    ...getBaseCookieOptions("/api/v1/auth"),
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  };
};

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie(
    ACCESS_TOKEN_COOKIE_NAME,
    accessToken,
    getAccessTokenCookieOptions(),
  );
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getBaseCookieOptions("/api/v1"));
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    getBaseCookieOptions("/api/v1/auth"),
  );
};

const clearAuthCookies = (res) => {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
};

const getAccessTokenCookieName = () => {
  return ACCESS_TOKEN_COOKIE_NAME;
};

const getRefreshTokenCookieName = () => {
  return REFRESH_TOKEN_COOKIE_NAME;
};

export {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setAuthCookies,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  clearAuthCookies,
  getAccessTokenCookieName,
  getRefreshTokenCookieName,
};
