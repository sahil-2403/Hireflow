import apiClient from "./apiClient";

const getMyCandidateProfile = async () => {
  const response = await apiClient.get("/candidates/profile");

  return response.data;
};

const createCandidateProfile = async (profileData) => {
  const response = await apiClient.post("/candidates/profile", profileData);

  return response.data;
};

const updateCandidateProfile = async (profileData) => {
  const response = await apiClient.patch("/candidates/profile", profileData);

  return response.data;
};

const uploadCandidateResume = async (resumeFile) => {
  const formData = new FormData();

  formData.append("resume", resumeFile);

  const response = await apiClient.patch(
    "/candidates/profile/resume",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export {
  getMyCandidateProfile,
  createCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
};
