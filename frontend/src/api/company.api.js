import apiClient from "./apiClient";

const getPublicCompany = async () => {
  const response = await apiClient.get("/company/public");

  return response.data;
};

const createCompanyProfile = async (companyData) => {
  const response = await apiClient.post("/company", companyData);

  return response.data;
};

const updateCompanyProfile = async (companyData) => {
  const response = await apiClient.patch("/company", companyData);

  return response.data;
};

const uploadCompanyLogo = async (logoFile) => {
  const formData = new FormData();

  formData.append("logo", logoFile);

  const response = await apiClient.patch("/company/logo", formData);

  return response.data;
};

export {
  getPublicCompany,
  createCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
};
