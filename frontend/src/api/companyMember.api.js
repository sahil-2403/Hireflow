import apiClient from "./apiClient";

const getMyCompanyMemberProfile = async () => {
  const response = await apiClient.get("/company/members/me");

  return response.data;
};

const updateMyCompanyMemberProfile = async (profileData) => {
  const response = await apiClient.patch("/company/members/me", profileData);

  return response.data;
};

export { getMyCompanyMemberProfile, updateMyCompanyMemberProfile };