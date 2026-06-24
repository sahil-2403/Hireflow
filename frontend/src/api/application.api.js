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

const listManagedApplications = async (params = {}) => {
  const response = await apiClient.get("/applications/manage", {
    params,
  });

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

export {
  listMyApplications,
  applyToJob,
  listManagedApplications,
  updateManagedApplicationStatus,
};
