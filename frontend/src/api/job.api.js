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

export { listPublicJobs, getPublicJobById };
