import apiClient from "./apiClient";

const getCandidateResumeInsights = async () => {
  const response = await apiClient.get("/ai/candidates/resume/analysis");

  return response.data;
};

const generateCandidateResumeInsights = async () => {
  const response = await apiClient.post("/ai/candidates/resume/analyze");

  return response.data;
};

export { generateCandidateResumeInsights, getCandidateResumeInsights };
