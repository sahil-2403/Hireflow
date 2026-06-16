import mongoose from "mongoose";

import Company from "../company/company.model.js";
import Recruiter from "../recruiter/recruiter.model.js";
import Candidate from "../candidate/candidate.model.js";
import Job from "../job/job.model.js";
import Application from "../application/application.model.js";

import ApiError from "../../shared/errors/ApiError.js";

import {
  ROLES,
  JOB_STATUS,
  APPLICATION_STATUS,
} from "../../config/constants.js";

const getStaffCompany = async (userId, role) => {
  if (role === ROLES.OWNER) {
    const company = await Company.findOne({
      ownerId: userId,
    });

    if (!company) {
      throw new ApiError(404, "Company profile not found");
    }

    return company;
  }

  if (role === ROLES.RECRUITER) {
    const recruiter = await Recruiter.findOne({
      userId,
      isActive: true,
    });

    if (!recruiter) {
      throw new ApiError(403, "Active recruiter profile not found");
    }

    const company = await Company.findById(recruiter.companyId);

    if (!company) {
      throw new ApiError(404, "Company profile not found");
    }

    return company;
  }

  throw new ApiError(403, "You are not allowed to access company analytics");
};

const getCompanyOverview = async (userId, role) => {
  const company = await getStaffCompany(userId, role);

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
  const company = await getStaffCompany(userId, role);

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
  const company = await getStaffCompany(userId, role);

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
  getCandidateOverview,
};
