import apiClient from "./apiClient";

const listMyApplications = async (params = {}) => {
  const response = await apiClient.get("/applications/me", {
    params,
  });

  return response.data;
};

const applyToJob = async (jobId, applicationData) => {
  const response = await apiClient.post(
    `/applications/jobs/${jobId}/apply`,
    applicationData,
  );

  return response.data;
};

const listManagedApplicationJobs = async (params = {}) => {
  const response = await apiClient.get("/applications/manage/jobs", {
    params,
  });

  return response.data;
};

const listManagedJobApplications = async (jobId, params = {}) => {
  const response = await apiClient.get(
    `/applications/manage/jobs/${jobId}/applications`,
    {
      params,
    },
  );

  return response.data;
};

const getManagedJobApplicationDetails = async (jobId, applicationId) => {
  const response = await apiClient.get(
    `/applications/manage/jobs/${jobId}/applications/${applicationId}`,
  );

  return response.data;
};

const updateManagedApplicationStatus = async (applicationId, status) => {
  const response = await apiClient.patch(
    `/applications/${applicationId}/status`,
    {
      status,
    },
  );

  return response.data;
};

const viewManagedApplicationResume = async (applicationId) => {
  const response = await apiClient.get(
    `/applications/manage/${applicationId}/resume/view`,
    {
      responseType: "blob",
    },
  );

  return response.data;
};

const getMyApplicationSummary = async () => {
  const response = await apiClient.get("/applications/me/summary");

  return response.data;
};

export {
  listMyApplications,
  applyToJob,
  listManagedApplicationJobs,
  listManagedJobApplications,
  getManagedJobApplicationDetails,
  updateManagedApplicationStatus,
  viewManagedApplicationResume,
  getMyApplicationSummary,
};
