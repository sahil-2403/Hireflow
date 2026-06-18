import apiClient from "./apiClient";

const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);

  return response.data;
};

const registerCandidate = async (candidateData) => {
  const response = await apiClient.post("/auth/register", candidateData);

  return response.data;
};

const resendVerificationEmail = async (emailData) => {
  const response = await apiClient.post("/auth/resend-verification", emailData);

  return response.data;
};

const forgotPassword = async (emailData) => {
  const response = await apiClient.post("/auth/forgot-password", emailData);

  return response.data;
};

const resetPassword = async (token, passwordData) => {
  const response = await apiClient.post(
    `/auth/reset-password/${token}`,
    passwordData,
  );

  return response.data;
};

const verifyEmail = async (token) => {
  const response = await apiClient.get(`/auth/verify-email/${token}`);

  return response.data;
};

export {
  login,
  registerCandidate,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
