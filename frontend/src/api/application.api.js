import apiClient from "./apiClient";

const listMyApplications = async (params = {}) => {
  const response = await apiClient.get("/applications/me", {
    params,
  });

  return response.data;
};

export { listMyApplications };
