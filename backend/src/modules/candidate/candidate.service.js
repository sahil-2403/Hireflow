import Candidate from "./candidate.model.js";

import ApiError from "../../shared/errors/ApiError.js";

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

export {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
};
