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

export { listMyApplications, applyToJob };
