import Candidate from "./candidate.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  uploadResumeFile,
  deleteAsset,
} from "../../shared/services/media.service.js";

const createCandidateProfile = async (userId, profileData) => {
  const existingProfile = await Candidate.findOne({
    userId,
  });

  if (existingProfile) {
    throw new ApiError(409, "Candidate profile already exists");
  }

  const profile = await Candidate.create({
    ...profileData,
    userId,
  });

  return {
    profile,
    message: "Candidate profile created successfully",
  };
};

const getMyCandidateProfile = async (userId) => {
  const profile = await Candidate.findOne({
    userId,
  })
    .populate({
      path: "userId",
      select: "username email role isEmailVerified",
    })
    .lean();

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  return profile;
};

const updateCandidateProfile = async (userId, profileData) => {
  const profile = await Candidate.findOneAndUpdate(
    {
      userId,
    },
    {
      $set: profileData,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  return {
    profile,
    message: "Candidate profile updated successfully",
  };
};

const uploadCandidateResume = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "Resume file is required");
  }

  const profile = await Candidate.findOne({
    userId,
  });

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  const oldPublicId = profile.resumePublicId;

  const uploadedAsset = await uploadResumeFile(file.buffer);

  try {
    profile.resumeUrl = uploadedAsset.url;
    profile.resumePublicId = uploadedAsset.publicId;

    await profile.save();
  } catch (error) {
    await deleteAsset(uploadedAsset.publicId, "raw");

    throw error;
  }

  return {
    profile,
    message: "Resume uploaded successfully",
  };
};

const getMyCandidateResume = async (userId) => {
  const profile = await Candidate.findOne({
    userId,
  }).lean();

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  if (!profile.resumeUrl) {
    throw new ApiError(404, "Resume not found");
  }

  const firstName = profile.firstName || "candidate";

  const lastName = profile.lastName || "resume";

  return {
    resumeUrl: profile.resumeUrl,
    fileName: `${firstName}-${lastName}-resume.pdf`,
  };
};

export {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
  getMyCandidateResume,
};
