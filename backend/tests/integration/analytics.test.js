import request from "supertest";

import app from "../../src/app.js";

import Application from "../../src/modules/application/application.model.js";

import {
  ROLES,
  APPLICATION_STATUS,
  JOB_STATUS,
} from "../../src/config/constants.js";

import { createVerifiedUser, loginUser } from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createRecruiterProfile,
  createCandidateProfile,
  createOpenJob,
} from "../helpers/business.helpers.js";

const createOwnerData = (suffix) => ({
  username: `an_owner_${suffix}`,
  email: `an.owner.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.OWNER,
});

const createRecruiterData = (suffix) => ({
  username: `an_rec_${suffix}`,
  email: `an.rec.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.RECRUITER,
});

const createCandidateData = (suffix) => ({
  username: `an_cand_${suffix}`,
  email: `an.cand.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.CANDIDATE,
});

const createMatchSnapshot = (score = 75) => ({
  matchScore: score,
  matchLabel: score >= 80 ? "Strong match" : "Good match",
  confidenceScore: 90,
  confidenceLevel: "high",
  breakdown: {
    skills: score,
  },
  matchedSkills: ["JavaScript", "React"],
  missingSkills: ["AWS"],
  extraCandidateSkills: ["MongoDB"],
  reasons: ["Candidate has relevant MERN skills."],
  warnings: [],
  calculatedAt: new Date(),
});

const setupCompany = async (suffix = "base") => {
  const ownerData = createOwnerData(suffix);
  const recruiterData = createRecruiterData(suffix);

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  const recruiterUser = await createVerifiedUser(recruiterData);

  const recruiterProfile = await createRecruiterProfile({
    userId: recruiterUser._id,
    companyId: company._id,
    createdBy: owner._id,
  });

  const ownerSession = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  const recruiterSession = await loginUser({
    email: recruiterData.email,
    password: recruiterData.password,
  });

  return {
    owner,
    company,
    recruiterUser,
    recruiterProfile,
    ownerSession,
    recruiterSession,
  };
};

const setupCandidate = async (suffix = "base", profileOverrides = {}) => {
  const candidateData = createCandidateData(suffix);

  const candidateUser = await createVerifiedUser(candidateData);

  const candidateProfile = await createCandidateProfile({
    userId: candidateUser._id,
    resumeUrl:
      profileOverrides.resumeUrl === undefined
        ? "https://example.com/test-resume.pdf"
        : profileOverrides.resumeUrl,
  });

  Object.assign(candidateProfile, profileOverrides);
  await candidateProfile.save();

  const candidateSession = await loginUser({
    email: candidateData.email,
    password: candidateData.password,
  });

  return {
    candidateData,
    candidateUser,
    candidateProfile,
    candidateSession,
  };
};

const createApplication = async ({
  job,
  company,
  candidateUser,
  candidateProfile,
  status = APPLICATION_STATUS.APPLIED,
  reviewedBy = null,
  matchScore = 75,
  appliedAt = new Date(),
}) => {
  const statusHistory = [
    {
      status: APPLICATION_STATUS.APPLIED,
      changedBy: candidateUser._id,
    },
  ];

  if (status !== APPLICATION_STATUS.APPLIED) {
    statusHistory.push({
      status,
      changedBy: reviewedBy,
    });
  }

  return Application.create({
    jobId: job._id,
    candidateId: candidateProfile._id,
    candidateUserId: candidateUser._id,
    companyId: company._id,
    resumeUrl: candidateProfile.resumeUrl,
    status,
    statusHistory,
    reviewedBy,
    matchSnapshot: createMatchSnapshot(matchScore),
    appliedAt,
  });
};

describe("Analytics API", () => {
  test("company overview returns correct job, application, recruiter, and recent application totals", async () => {
    const { owner, company, ownerSession, recruiterProfile } =
      await setupCompany("overview");

    const firstCandidate = await setupCandidate("ovone");
    const secondCandidate = await setupCandidate("ovtwo");

    const openJob = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Analytics Open Job",
    });

    const closedJob = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Analytics Closed Job",
    });

    closedJob.status = JOB_STATUS.CLOSED;
    closedJob.closedAt = new Date();
    await closedJob.save();

    await createApplication({
      job: openJob,
      company,
      candidateUser: firstCandidate.candidateUser,
      candidateProfile: firstCandidate.candidateProfile,
      status: APPLICATION_STATUS.HIRED,
      reviewedBy: owner._id,
      matchScore: 88,
    });

    await createApplication({
      job: closedJob,
      company,
      candidateUser: secondCandidate.candidateUser,
      candidateProfile: secondCandidate.candidateProfile,
      status: APPLICATION_STATUS.REJECTED,
      reviewedBy: owner._id,
      matchScore: 45,
    });

    const response = await ownerSession.agent
      .get("/api/v1/analytics/company/overview")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Company analytics fetched successfully",
    );

    expect(response.body.data.company).toEqual(
      expect.objectContaining({
        id: company._id.toString(),
        name: "HireFlow Test Company",
      }),
    );

    expect(response.body.data.jobs).toEqual({
      totalJobs: 2,
      openJobs: 1,
      closedJobs: 1,
    });

    expect(response.body.data.applications).toEqual({
      totalApplications: 2,
      uniqueCandidates: 2,
      hiredCandidates: 1,
      rejectedApplications: 1,
    });

    expect(response.body.data.recruiters.activeRecruiters).toBe(1);
    expect(response.body.data.recentApplications).toHaveLength(2);

    expect(recruiterProfile.isActive).toBe(true);
  });

  test("company overview returns safe zero counts when company has no jobs or applications", async () => {
    const { company, ownerSession } = await setupCompany("empty");

    const response = await ownerSession.agent
      .get("/api/v1/analytics/company/overview")
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.company).toEqual(
      expect.objectContaining({
        id: company._id.toString(),
      }),
    );

    expect(response.body.data.jobs).toEqual({
      totalJobs: 0,
      openJobs: 0,
      closedJobs: 0,
    });

    expect(response.body.data.applications).toEqual({
      totalApplications: 0,
      uniqueCandidates: 0,
      hiredCandidates: 0,
      rejectedApplications: 0,
    });

    expect(response.body.data.recentApplications).toHaveLength(0);
  });

  test("recruiter can access company overview for assigned company", async () => {
    const { company, owner, recruiterSession } = await setupCompany("recview");

    await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Recruiter Analytics Job",
    });

    const response = await recruiterSession.agent
      .get("/api/v1/analytics/company/overview")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.jobs.totalJobs).toBe(1);
  });

  test("candidate cannot access company analytics", async () => {
    const { candidateSession } = await setupCandidate("denied");

    const response = await candidateSession.agent
      .get("/api/v1/analytics/company/overview")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("unauthenticated user cannot access company analytics", async () => {
    const response = await request(app)
      .get("/api/v1/analytics/company/overview")
      .expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("hiring funnel returns counts for every application status", async () => {
    const { owner, company, ownerSession } = await setupCompany("funnel");

    const firstCandidate = await setupCandidate("funone");
    const secondCandidate = await setupCandidate("funtwo");
    const thirdCandidate = await setupCandidate("funthr");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Hiring Funnel Job",
    });

    await createApplication({
      job,
      company,
      candidateUser: firstCandidate.candidateUser,
      candidateProfile: firstCandidate.candidateProfile,
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 60,
    });

    await createApplication({
      job,
      company,
      candidateUser: secondCandidate.candidateUser,
      candidateProfile: secondCandidate.candidateProfile,
      status: APPLICATION_STATUS.INTERVIEW,
      reviewedBy: owner._id,
      matchScore: 80,
    });

    await createApplication({
      job,
      company,
      candidateUser: thirdCandidate.candidateUser,
      candidateProfile: thirdCandidate.candidateProfile,
      status: APPLICATION_STATUS.REJECTED,
      reviewedBy: owner._id,
      matchScore: 30,
    });

    const response = await ownerSession.agent
      .get("/api/v1/analytics/company/hiring-funnel")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Hiring funnel fetched successfully");

    const statusCounts = Object.fromEntries(
      response.body.data.funnel.map((item) => [item.status, item.count]),
    );

    expect(statusCounts[APPLICATION_STATUS.APPLIED]).toBe(1);
    expect(statusCounts[APPLICATION_STATUS.INTERVIEW]).toBe(1);
    expect(statusCounts[APPLICATION_STATUS.REJECTED]).toBe(1);
    expect(statusCounts[APPLICATION_STATUS.HIRED]).toBe(0);
  });

  test("top jobs returns jobs ranked by application count", async () => {
    const { owner, company, ownerSession } = await setupCompany("topjobs");

    const candidateOne = await setupCandidate("tjone");
    const candidateTwo = await setupCandidate("tjtwo");
    const candidateThree = await setupCandidate("tjthr");

    const popularJob = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Popular Analytics Job",
    });

    const quietJob = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Quiet Analytics Job",
    });

    await createApplication({
      job: popularJob,
      company,
      candidateUser: candidateOne.candidateUser,
      candidateProfile: candidateOne.candidateProfile,
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 70,
    });

    await createApplication({
      job: popularJob,
      company,
      candidateUser: candidateTwo.candidateUser,
      candidateProfile: candidateTwo.candidateProfile,
      status: APPLICATION_STATUS.HIRED,
      reviewedBy: owner._id,
      matchScore: 90,
    });

    await createApplication({
      job: quietJob,
      company,
      candidateUser: candidateThree.candidateUser,
      candidateProfile: candidateThree.candidateProfile,
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 55,
    });

    const response = await ownerSession.agent
      .get("/api/v1/analytics/company/top-jobs")
      .query({
        limit: 2,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Top jobs fetched successfully");

    expect(response.body.data).toHaveLength(2);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        _id: popularJob._id.toString(),
        title: "Popular Analytics Job",
        applicationCount: 2,
        hiredCount: 1,
      }),
    );

    expect(response.body.data[1]).toEqual(
      expect.objectContaining({
        _id: quietJob._id.toString(),
        title: "Quiet Analytics Job",
        applicationCount: 1,
        hiredCount: 0,
      }),
    );
  });

  test("top applicants returns the highest match applicant for latest jobs", async () => {
    const { owner, company, ownerSession } = await setupCompany("topapps");

    const strongCandidate = await setupCandidate("tas");
    const weakCandidate = await setupCandidate("taw");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Latest Job With Applicants",
    });

    await createApplication({
      job,
      company,
      candidateUser: weakCandidate.candidateUser,
      candidateProfile: weakCandidate.candidateProfile,
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 42,
    });

    const topApplication = await createApplication({
      job,
      company,
      candidateUser: strongCandidate.candidateUser,
      candidateProfile: strongCandidate.candidateProfile,
      status: APPLICATION_STATUS.SCREENING,
      reviewedBy: owner._id,
      matchScore: 91,
    });

    const response = await ownerSession.agent
      .get("/api/v1/analytics/company/top-applicants")
      .query({
        limit: 5,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Top applicants by latest jobs fetched successfully",
    );

    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0].job).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Latest Job With Applicants",
      }),
    );

    expect(response.body.data[0].topApplicant).toEqual(
      expect.objectContaining({
        applicationId: topApplication._id.toString(),
        status: APPLICATION_STATUS.SCREENING,
        candidate: expect.objectContaining({
          firstName: "Test",
          lastName: "Candidate",
        }),
        match: expect.objectContaining({
          matchScore: 91,
          matchLabel: "Strong match",
        }),
      }),
    );
  });

  test("candidate overview returns application counts and profile completion", async () => {
    const { owner, company } = await setupCompany("candov");

    const candidate = await setupCandidate("cover", {
      linkedinUrl: "https://linkedin.com/in/test-candidate",
      githubUrl: "https://github.com/test-candidate",
      portfolioUrl: "https://portfolio.example.com",
    });

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Candidate Overview Job",
    });

    await createApplication({
      job,
      company,
      candidateUser: candidate.candidateUser,
      candidateProfile: candidate.candidateProfile,
      status: APPLICATION_STATUS.APPLIED,
      matchScore: 74,
    });

    const response = await candidate.candidateSession.agent
      .get("/api/v1/analytics/candidate/overview")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Candidate analytics fetched successfully",
    );

    expect(response.body.data.profile).toEqual(
      expect.objectContaining({
        id: candidate.candidateProfile._id.toString(),
        firstName: "Test",
        lastName: "Candidate",
        profileCompletionPercentage: expect.any(Number),
      }),
    );

    expect(response.body.data.totalApplications).toBe(1);

    const statusCounts = Object.fromEntries(
      response.body.data.applicationsByStatus.map((item) => [
        item.status,
        item.count,
      ]),
    );

    expect(statusCounts[APPLICATION_STATUS.APPLIED]).toBe(1);
    expect(statusCounts[APPLICATION_STATUS.HIRED]).toBe(0);

    expect(response.body.data.recentApplications).toHaveLength(1);
    expect(response.body.data.recentApplications[0].jobId).toEqual(
      expect.objectContaining({
        title: "Candidate Overview Job",
      }),
    );
  });

  test("candidate overview returns 404 when candidate profile does not exist", async () => {
    const candidateData = createCandidateData("noprofile");
    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await candidateSession.agent
      .get("/api/v1/analytics/candidate/overview")
      .expect(404);

    expect(response.body.message).toBe("Candidate profile not found");
  });

  test("company admin cannot access candidate analytics", async () => {
    const { ownerSession } = await setupCompany("cantcand");

    const response = await ownerSession.agent
      .get("/api/v1/analytics/candidate/overview")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });
});
