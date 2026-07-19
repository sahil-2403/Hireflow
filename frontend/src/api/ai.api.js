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

const generateApplicationResumeReview = async (applicationId) => {
  const response = await apiClient.post(
    `/ai/applications/${applicationId}/resume-review`,
    {},
    {
      timeout: 120000,
    },
  );

  return response.data;
};

const generateApplicationInterviewKit = async (applicationId) => {
  const response = await apiClient.post(
    `/ai/applications/${applicationId}/interview-kit`,
    {},
    {
      timeout: 120000,
    },
  );

  return response.data;
};

const generateJobPostAssistantSuggestions = async (jobDraft) => {
  const response = await apiClient.post("/ai/jobs/post-suggestions", jobDraft, {
    timeout: 120000,
  });

  return response.data;
};

const generateSuggestedShortlist = async (jobId, limit) => {
  const response = await apiClient.post(
    `/ai/jobs/${jobId}/suggested-shortlist`,
    {
      limit,
    },
    {
      timeout: 120000,
    },
  );

  return response.data;
};

const generateCandidateComparison = async (jobId, applicationIds) => {
  const response = await apiClient.post(
    `/ai/jobs/${jobId}/candidate-comparison`,
    {
      applicationIds,
    },
    {
      timeout: 120000,
    },
  );

  return response.data;
};

export {
  generateCandidateJobResumeFit,
  generateCandidateResumeInsights,
  getCandidateResumeInsights,
  generateApplicationResumeReview,
  generateJobPostAssistantSuggestions,
  generateSuggestedShortlist,
  generateApplicationInterviewKit,
  generateCandidateComparison,
};
