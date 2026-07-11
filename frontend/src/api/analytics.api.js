import apiClient from "./apiClient";

const getCompanyOverview = async () => {
  const response = await apiClient.get("/analytics/company/overview");

  return response.data;
};

const getCompanyHiringFunnel = async () => {
  const response = await apiClient.get("/analytics/company/hiring-funnel");

  return response.data;
};

const getCompanyTopJobs = async (params = {}) => {
  const response = await apiClient.get("/analytics/company/top-jobs", {
    params,
  });

  return response.data;
};

const getCompanyTopApplicants = async (params = {}) => {
  const response = await apiClient.get("/analytics/company/top-applicants", {
    params,
  });

  return response.data;
};

export {
  getCompanyOverview,
  getCompanyHiringFunnel,
  getCompanyTopJobs,
  getCompanyTopApplicants,
};
