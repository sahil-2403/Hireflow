import apiClient, { UPLOAD_REQUEST_TIMEOUT_MS } from "./apiClient";

const appendCompanyDataToFormData = (formData, companyData) => {
  Object.entries(companyData).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });
};

const getMyCompany = async () => {
  const response = await apiClient.get("/company");

  return response.data;
};

const createCompanyProfile = async (companyData, logoFile = null) => {
  if (!logoFile) {
    const response = await apiClient.post("/company", companyData);

    return response.data;
  }

  const formData = new FormData();

  appendCompanyDataToFormData(formData, companyData);
  formData.append("logo", logoFile);

  const response = await apiClient.post("/company", formData, {
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    _isUploadRequest: true,
  });

  return response.data;
};

const updateCompanyProfile = async (companyData) => {
  const response = await apiClient.patch("/company", companyData);

  return response.data;
};

const uploadCompanyLogo = async (logoFile) => {
  const formData = new FormData();

  formData.append("logo", logoFile);

  const response = await apiClient.patch("/company/logo", formData, {
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
    _isUploadRequest: true,
  });

  return response.data;
};

const deleteCompanyLogo = async () => {
  const response = await apiClient.delete("/company/logo");

  return response.data;
};

const createRecruiter = async (recruiterData) => {
  const response = await apiClient.post("/company/recruiters", recruiterData);

  return response.data;
};

const listRecruiters = async () => {
  const response = await apiClient.get("/company/recruiters");

  return response.data;
};

const updateRecruiterStatus = async (recruiterId, isActive) => {
  const response = await apiClient.patch(
    `/company/recruiters/${recruiterId}/status`,
    {
      isActive,
    },
  );

  return response.data;
};

export {
  getMyCompany,
  createCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  deleteCompanyLogo,
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
};
