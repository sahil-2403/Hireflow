import apiClient from "./apiClient";

const getCandidateResumeInsights = async () => {
  const response = await apiClient.get("/ai/candidates/resume/analysis");

  return response.data;
};

const generateCandidateResumeInsights = async () => {
  const response = await apiClient.post("/ai/candidates/resume/analyze");

  return response.data;
};

const generateCandidateJobResumeFit = async (jobId) => {
  const response = await apiClient.post(`/ai/jobs/${jobId}/resume-fit`);

  return response.data;
};

export {
  generateCandidateJobResumeFit,
  generateCandidateResumeInsights,
  getCandidateResumeInsights,
};
