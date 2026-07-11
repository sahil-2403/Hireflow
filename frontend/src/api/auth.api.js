import apiClient, { UPLOAD_REQUEST_TIMEOUT_MS } from "./apiClient";

const login = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);

  return response.data;
};

const registerUser = async (registrationData) => {
  const response = await apiClient.post("/auth/register", registrationData);

  return response.data;
};

const resendVerificationEmail = async (email) => {
  const response = await apiClient.post("/auth/resend-verification", {
    email,
  });

  return response.data;
};

const forgotPassword = async (email) => {
  const response = await apiClient.post("/auth/forgot-password", {
    email,
  });

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

const refreshSession = async () => {
  const response = await apiClient.post("/auth/refresh-token");

  return response.data;
};

const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");

  return response.data;
};

const uploadProfilePhoto = async (photoFile) => {
  const formData = new FormData();

  formData.append("photo", photoFile);

  const response = await apiClient.patch("/auth/me/profile-photo", formData, {
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    _isUploadRequest: true,
  });

  return response.data;
};

const deleteProfilePhoto = async () => {
  const response = await apiClient.delete("/auth/me/profile-photo");

  return response.data;
};

const logout = async () => {
  const response = await apiClient.post("/auth/logout");

  return response.data;
};

export {
  login,
  registerUser,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshSession,
  getCurrentUser,
  uploadProfilePhoto,
  deleteProfilePhoto,
  logout,
};
