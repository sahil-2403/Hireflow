import apiClient from "./apiClient";

const listRecommendedJobs = async (params = {}) => {
  const response = await apiClient.get("/recommendations/jobs", {
    params,
  });

  return response.data;
};

const getRecommendedJobMatch = async (jobId) => {
  const response = await apiClient.get(`/recommendations/jobs/${jobId}/match`);

  return response.data;
};

export { listRecommendedJobs, getRecommendedJobMatch };
