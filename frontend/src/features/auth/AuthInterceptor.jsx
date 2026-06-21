import { useEffect } from "react";

import apiClient from "../../api/apiClient";
import { refreshSession } from "../../api/auth.api";

import useAuth from "../../hooks/useAuth";

let refreshPromise = null;

const AuthInterceptor = () => {
  const { session, accessToken, refreshToken, updateSession, signOut } =
    useAuth();

  useEffect(() => {
    const requestInterceptorId = apiClient.interceptors.request.use(
      (config) => {
        if (config._skipAuth || !accessToken) {
          return config;
        }

        config.headers = config.headers ?? {};

        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
    );

    const responseInterceptorId = apiClient.interceptors.response.use(
      (response) => response,

      async (error) => {
        const originalRequest = error.config;

        const statusCode = error.response?.status;

        const shouldTryRefresh =
          statusCode === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest._skipAuthRefresh &&
          refreshToken &&
          session?.user;

        if (!shouldTryRefresh) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = refreshSession(refreshToken).finally(() => {
              refreshPromise = null;
            });
          }

          const result = await refreshPromise;

          const newAccessToken = result.data?.accessToken;

          const newRefreshToken = result.data?.refreshToken;

          if (!newAccessToken || !newRefreshToken) {
            throw new Error("Refresh response did not include new tokens.");
          }

          const updatedSession = {
            user: session.user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          };

          updateSession(updatedSession);

          originalRequest.headers = originalRequest.headers ?? {};

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          signOut();

          return Promise.reject(refreshError);
        }
      },
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptorId);

      apiClient.interceptors.response.eject(responseInterceptorId);
    };
  }, [accessToken, refreshToken, session, updateSession, signOut]);

  return null;
};

export default AuthInterceptor;
