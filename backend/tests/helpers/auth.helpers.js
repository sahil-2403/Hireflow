import request from "supertest";

import app from "../../src/app.js";
import User from "../../src/modules/auth/auth.model.js";

import {
  getAccessTokenCookieName,
  getRefreshTokenCookieName,
} from "../../src/modules/auth/auth.cookie.js";

const createVerifiedUser = async ({
  username,
  email,
  password = "Password123",
  role,
  isActive = true,
}) => {
  return User.create({
    username,
    email,
    password,
    role,
    isEmailVerified: true,
    isActive,
  });
};

const createTestAgent = () => {
  return request.agent(app);
};

const getSetCookies = (response) => {
  return response.headers["set-cookie"] || [];
};

const getCookieValue = (cookies, cookieName) => {
  const cookie = cookies
    .map((value) => value.split(";")[0])
    .find((value) => value.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return cookie.slice(cookieName.length + 1);
};

const getCookieHeaderFromSetCookies = (cookies) => {
  return cookies.map((value) => value.split(";")[0]).join("; ");
};

const createCookieHeader = (cookies) => {
  return {
    Cookie: getCookieHeaderFromSetCookies(cookies),
  };
};

const csrfHeader = (csrfToken) => {
  return {
    "X-CSRF-Token": csrfToken,
  };
};

const getCsrfToken = async (agent = createTestAgent()) => {
  const response = await agent.get("/api/v1/auth/csrf-token").expect(200);

  return response.body.data.csrfToken;
};

const postWithCsrf = async (agent, url, body = {}, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);

  return agent
    .post(url)
    .set(csrfHeader(csrfToken))
    .send(body)
    .expect(expectedStatus);
};

const patchWithCsrf = async (agent, url, body = {}, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);

  return agent
    .patch(url)
    .set(csrfHeader(csrfToken))
    .send(body)
    .expect(expectedStatus);
};

const putWithCsrf = async (agent, url, body = {}, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);

  return agent
    .put(url)
    .set(csrfHeader(csrfToken))
    .send(body)
    .expect(expectedStatus);
};

const deleteWithCsrf = async (agent, url, expectedStatus = 200) => {
  const csrfToken = await getCsrfToken(agent);

  return agent.delete(url).set(csrfHeader(csrfToken)).expect(expectedStatus);
};

const authHeader = (accessToken) => {
  return {
    Cookie: `${getAccessTokenCookieName()}=${accessToken}`,
  };
};

const refreshHeader = (refreshToken) => {
  return {
    Cookie: `${getRefreshTokenCookieName()}=${refreshToken}`,
  };
};

const invalidAccessCookieHeader = () => {
  return {
    Cookie: `${getAccessTokenCookieName()}=invalid-token`,
  };
};

const loginUser = async ({
  email,
  password = "Password123",
  agent = createTestAgent(),
}) => {
  const response = await postWithCsrf(
    agent,
    "/api/v1/auth/login",
    {
      email,
      password,
    },
    200,
  );

  const cookies = getSetCookies(response);

  const accessToken = getCookieValue(cookies, getAccessTokenCookieName());
  const refreshToken = getCookieValue(cookies, getRefreshTokenCookieName());

  return {
    agent,
    response,
    cookies,
    accessToken,
    refreshToken,
    user: response.body.data.user,
  };
};

const createAuthenticatedAgent = async (userData) => {
  await createVerifiedUser(userData);

  return loginUser({
    email: userData.email,
    password: userData.password,
  });
};

export {
  createVerifiedUser,
  createTestAgent,
  createAuthenticatedAgent,
  loginUser,
  authHeader,
  refreshHeader,
  invalidAccessCookieHeader,
  getSetCookies,
  getCookieValue,
  getCookieHeaderFromSetCookies,
  createCookieHeader,
  csrfHeader,
  getCsrfToken,
  postWithCsrf,
  patchWithCsrf,
  putWithCsrf,
  deleteWithCsrf,
};
