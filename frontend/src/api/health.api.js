import apiClient from "./apiClient";

const getApiHealth = async () => {
  const response = await apiClient.get("/health");

  return response.data;
};

export { getApiHealth };
