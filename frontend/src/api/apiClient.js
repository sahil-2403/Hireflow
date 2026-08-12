import axios from "axios";

import { API_BASE_URL } from "../config/env";

const CSRF_HEADER_NAME = "X-CSRF-Token";
const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_REQUEST_TIMEOUT_MS = 120000;

let csrfToken = null;
let csrfTokenRequest = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

const isUnsafeRequest = (method = "get") => {
  return UNSAFE_METHODS.has(method.toLowerCase());
};

const fetchCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenRequest) {
    csrfTokenRequest = apiClient
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
        csrfTokenRequest = null;
      });
  }

  return csrfTokenRequest;
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
  (error) => {
    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes("csrf");

    if (isCsrfError) {
      csrfToken = null;
    }

    return Promise.reject(error);
  },
);

export { UPLOAD_REQUEST_TIMEOUT_MS };
export default apiClient;
