import { useEffect } from "react";

import apiClient from "../../api/apiClient";
import { refreshSession } from "../../api/auth.api";
import useAuth from "../../hooks/useAuth";

const AuthInterceptor = ({ children }) => {
  const { signOut } = useAuth();

  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url;

        const isRefreshRequest = requestUrl?.includes("/auth/refresh-token");
        const isLoginRequest = requestUrl?.includes("/auth/login");

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._authRetry &&
          !isRefreshRequest &&
          !isLoginRequest
        ) {
          originalRequest._authRetry = true;

          try {
            await refreshSession();
            return apiClient(originalRequest);
          } catch (refreshError) {
            signOut();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [signOut]);

  return children;
};

export default AuthInterceptor;
