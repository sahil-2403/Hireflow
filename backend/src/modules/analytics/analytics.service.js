import mongoose from "mongoose";

import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";
import Application from "../application/application.model.js";
import Recruiter from "../recruiter/recruiter.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import { JOB_STATUS, APPLICATION_STATUS } from "../../config/constants.js";

import { getStaffCompany } from "../../shared/utils/companyAccess.js";

const getCompanyOverview = async (userId, role) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to access company analytics",
  );

  const [jobSummary, applicationSummary, activeRecruiters, recentApplications] =
    await Promise.all([
      Job.aggregate([
        {
          $match: {
            companyId: company._id,
          },
        },
        {
          $group: {
            _id: null,

            totalJobs: {
              $sum: 1,
            },

            openJobs: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", JOB_STATUS.OPEN],
                  },
                  1,
                  0,
                ],
              },
            },

            closedJobs: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", JOB_STATUS.CLOSED],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalJobs: 1,
            openJobs: 1,
            closedJobs: 1,
          },
        },
      ]),

      Application.aggregate([
        {
          $match: {
            companyId: company._id,
          },
        },
        {
          $group: {
            _id: null,

            totalApplications: {
              $sum: 1,
            },

            uniqueCandidates: {
              $addToSet: "$candidateUserId",
            },

            hiredCandidates: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", APPLICATION_STATUS.HIRED],
                  },
                  1,
                  0,
                ],
              },
            },

            rejectedApplications: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", APPLICATION_STATUS.REJECTED],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalApplications: 1,
            hiredCandidates: 1,
            rejectedApplications: 1,

            uniqueCandidates: {
              $size: "$uniqueCandidates",
            },
          },
        },
      ]),

      Recruiter.countDocuments({
        companyId: company._id,
        isActive: true,
      }),

      Application.find({
        companyId: company._id,
      })
        .populate({
          path: "jobId",
          select: "title",
        })
        .populate({
          path: "candidateId",
          select: "firstName lastName headline",
        })
        .sort({
          appliedAt: -1,
        })
        .limit(5)
        .select("status appliedAt jobId candidateId")
        .lean(),
    ]);

  return {
    company: {
      id: company._id,
      name: company.name,
      logoUrl: company.logoUrl ?? null,
      industry: company.industry,
      headquarters: company.headquarters,
    },

    jobs: jobSummary[0] || {
      totalJobs: 0,
      openJobs: 0,
      closedJobs: 0,
    },

    applications: applicationSummary[0] || {
      totalApplications: 0,
      uniqueCandidates: 0,
      hiredCandidates: 0,
      rejectedApplications: 0,
    },

    recruiters: {
      activeRecruiters,
    },

    recentApplications,
  };
};

const getHiringFunnel = async (userId, role) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to access company analytics",
  );

  const groupedStatuses = await Application.aggregate([
    {
      $match: {
        companyId: company._id,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  const countMap = Object.fromEntries(
    groupedStatuses.map((item) => [item.status, item.count]),
  );

  const funnel = Object.values(APPLICATION_STATUS).map((status) => ({
    status,
    count: countMap[status] || 0,
  }));

  const totalApplications = funnel.reduce(
    (total, item) => total + item.count,
    0,
  );

  return {
    totalApplications,
    funnel,
  };
};

const getTopJobs = async (userId, role, requestedLimit) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to access company analytics",
  );

  const parsedLimit = Number(requestedLimit);

  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 20)
      : 5;

  const jobs = await Job.aggregate([
    {
      $match: {
        companyId: company._id,
      },
    },

    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "jobId",
        as: "applications",
      },
    },

    {
      $addFields: {
        applicationCount: {
          $size: "$applications",
        },

        hiredCount: {
          $size: {
            $filter: {
              input: "$applications",
              as: "application",
              cond: {
                $eq: ["$$application.status", APPLICATION_STATUS.HIRED],
              },
            },
          },
        },
      },
    },

    {
      $project: {
        title: 1,
        status: 1,
        location: 1,
        createdAt: 1,
        applicationCount: 1,
        hiredCount: 1,
      },
    },

    {
      $sort: {
        applicationCount: -1,
        createdAt: -1,
      },
    },

    {
      $limit: limit,
    },
  ]);

  return jobs;
};

const getTopApplicantsByLatestJobs = async (userId, role, requestedLimit) => {
  const company = await getStaffCompany(
    userId,
    role,
    "You are not allowed to access company analytics",
  );

  const parsedLimit = Number(requestedLimit);

  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 10)
      : 5;

  const latestJobsWithApplications = await Job.aggregate([
    {
      $match: {
        companyId: company._id,
      },
    },
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "jobId",
        as: "applications",
      },
    },
    {
      $addFields: {
        applicationCount: {
          $size: "$applications",
        },
      },
    },
    {
      $match: {
        applicationCount: {
          $gt: 0,
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        title: 1,
        status: 1,
        location: 1,
        createdAt: 1,
      },
    },
  ]);

  const jobIds = latestJobsWithApplications.map((job) => job._id);

  if (jobIds.length === 0) {
    return [];
  }

  const applications = await Application.find({
    companyId: company._id,
    jobId: {
      $in: jobIds,
    },
  })
    .select("+matchSnapshot status appliedAt jobId candidateId candidateUserId")
    .populate({
      path: "candidateId",
      select: "firstName lastName headline location",
    })
    .populate({
      path: "candidateUserId",
      select: "username email profilePhotoUrl",
    })
    .lean();

  const applicationsByJobId = new Map();

  applications.forEach((application) => {
    const jobId = String(application.jobId);

    const existingApplication = applicationsByJobId.get(jobId);

    const currentScore = application.matchSnapshot.matchScore;

    const existingScore = existingApplication
      ? existingApplication.matchSnapshot.matchScore
      : -1;

    const shouldReplace =
      !existingApplication ||
      currentScore > existingScore ||
      (currentScore === existingScore &&
        new Date(application.appliedAt || 0) >
          new Date(existingApplication.appliedAt || 0));

    if (shouldReplace) {
      applicationsByJobId.set(jobId, application);
    }
  });

  return latestJobsWithApplications
    .map((job) => {
      const topApplication = applicationsByJobId.get(String(job._id));

      if (!topApplication) {
        return null;
      }

      return {
        job: {
          _id: job._id,
          title: job.title,
          status: job.status,
          location: job.location,
          createdAt: job.createdAt,
        },

        topApplicant: {
          applicationId: topApplication._id,
          status: topApplication.status,
          appliedAt: topApplication.appliedAt,

          candidate: topApplication.candidateId
            ? {
                _id: topApplication.candidateId._id,
                firstName: topApplication.candidateId.firstName,
                lastName: topApplication.candidateId.lastName,
                headline: topApplication.candidateId.headline,
                location: topApplication.candidateId.location,
              }
            : null,

          candidateUser: topApplication.candidateUserId
            ? {
                _id: topApplication.candidateUserId._id,
                username: topApplication.candidateUserId.username,
                email: topApplication.candidateUserId.email,
                profilePhotoUrl: topApplication.candidateUserId.profilePhotoUrl,
              }
            : null,

          match: {
            matchScore: topApplication.matchSnapshot.matchScore,
            matchLabel: topApplication.matchSnapshot.matchLabel,
            confidenceLevel: topApplication.matchSnapshot.confidenceLevel,
          },
        },
      };
    })
    .filter(Boolean);
};

const getCandidateOverview = async (userId) => {
  const candidate = await Candidate.findOne({
    userId,
  }).lean();

  if (!candidate) {
    throw new ApiError(404, "Candidate profile not found");
  }

  const candidateUserId = new mongoose.Types.ObjectId(userId);

  const [statusSummary, recentApplications] = await Promise.all([
    Application.aggregate([
      {
        $match: {
          candidateUserId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]),

    Application.find({
      candidateUserId,
    })
      .populate({
        path: "jobId",
        select: "title location status workplaceType employmentType",
      })
      .populate({
        path: "companyId",
        select: "name logoUrl industry",
      })
      .sort({
        appliedAt: -1,
      })
      .limit(5)
      .select("status appliedAt jobId companyId")
      .lean(),
  ]);

  const countMap = Object.fromEntries(
    statusSummary.map((item) => [item.status, item.count]),
  );

  const applicationsByStatus = Object.values(APPLICATION_STATUS).map(
    (status) => ({
      status,
      count: countMap[status] || 0,
    }),
  );

  const totalApplications = applicationsByStatus.reduce(
    (total, item) => total + item.count,
    0,
  );

  const profileFields = [
    candidate.firstName,
    candidate.lastName,
    candidate.headline,
    candidate.summary,
    candidate.location,
    candidate.resumeUrl,
    candidate.linkedinUrl,
    candidate.githubUrl,
    candidate.portfolioUrl,
    candidate.skills?.length > 0,
  ];

  const completedFields = profileFields.filter(Boolean).length;

  const profileCompletionPercentage = Math.round(
    (completedFields / profileFields.length) * 100,
  );

  return {
    profile: {
      id: candidate._id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      headline: candidate.headline,
      resumeUrl: candidate.resumeUrl,
      profileCompletionPercentage,
    },

    totalApplications,
    applicationsByStatus,
    recentApplications,
  };
};

export {
  getCompanyOverview,
  getHiringFunnel,
  getTopJobs,
  getTopApplicantsByLatestJobs,
  getCandidateOverview,
};
