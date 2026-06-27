import axios from "axios";

import { API_BASE_URL } from "../config/env";

const CSRF_HEADER_NAME = "X-CSRF-Token";

const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

let csrfToken = null;
let csrfTokenPromise = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

const isUnsafeRequest = (method = "get") => {
  return UNSAFE_METHODS.has(method.toLowerCase());
};

const fetchCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = apiClient
      .get("/auth/csrf-token", {
        _skipCsrf: true,
      })
      .then((response) => {
        const token = response.data?.data?.csrfToken;

        if (!token) {
          throw new Error("CSRF token missing from response");
        }

        csrfToken = token;

        return token;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
};

apiClient.interceptors.request.use(async (config) => {
  if (config._skipCsrf || !isUnsafeRequest(config.method)) {
    return config;
  }

  const token = await fetchCsrfToken();

  config.headers = config.headers ?? {};
  config.headers[CSRF_HEADER_NAME] = token;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes("csrf");

    if (isCsrfError && originalRequest && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      csrfToken = null;

      const token = await fetchCsrfToken();

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers[CSRF_HEADER_NAME] = token;

      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
