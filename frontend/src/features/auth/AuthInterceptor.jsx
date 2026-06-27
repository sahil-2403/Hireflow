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

        const status = error.response?.status;
        const requestUrl = originalRequest?.url;

        const isAuthRefreshRequest = requestUrl?.includes(
          "/auth/refresh-token",
        );

        const isAuthLoginRequest = requestUrl?.includes("/auth/login");

        if (
          status === 401 &&
          !originalRequest?._retry &&
          !isAuthRefreshRequest &&
          !isAuthLoginRequest
        ) {
          originalRequest._retry = true;

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
