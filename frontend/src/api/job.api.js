import apiClient from "./apiClient";

const listPublicJobs = async (params = {}) => {
  const response = await apiClient.get("/jobs", {
    params,
  });

  return response.data;
};

const getPublicJobById = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}`);

  return response.data;
};

const listManagedJobs = async (params = {}) => {
  const response = await apiClient.get("/jobs/manage", {
    params,
  });

  return response.data;
};

const createManagedJob = async (jobData) => {
  const response = await apiClient.post("/jobs", jobData);

  return response.data;
};

const updateManagedJobStatus = async (jobId, status) => {
  const response = await apiClient.patch(`/jobs/${jobId}/status`, {
    status,
  });

  return response.data;
};

const getManagedJobById = async (jobId) => {
  const response = await apiClient.get(`/jobs/manage/${jobId}`);

  return response.data;
};

const updateManagedJob = async (jobId, jobData) => {
  const response = await apiClient.patch(`/jobs/${jobId}`, jobData);

  return response.data;
};

export {
  listPublicJobs,
  getPublicJobById,
  listManagedJobs,
  createManagedJob,
  updateManagedJobStatus,
  getManagedJobById,
  updateManagedJob,
};
