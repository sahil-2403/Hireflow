import request from "supertest";

import app from "../../src/app.js";

import Job from "../../src/modules/job/job.model.js";
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";

import {
  ROLES,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
} from "../../src/config/constants.js";

import { createVerifiedUser, loginUser } from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createCandidateProfile,
} from "../helpers/business.helpers.js";

const createOwnerData = (suffix) => ({
  username: `rec_owner_${suffix}`,
  email: `rec.owner.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.OWNER,
});

const createCandidateData = (suffix) => ({
  username: `rec_cand_${suffix}`,
  email: `rec.cand.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.CANDIDATE,
});

const setupCompany = async (suffix = "base") => {
  const ownerData = createOwnerData(suffix);

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  const ownerSession = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  return {
    owner,
    company,
    ownerSession,
  };
};

const setupCandidate = async (suffix = "base", profileOverrides = {}) => {
  const candidateData = createCandidateData(suffix);

  const candidateUser = await createVerifiedUser(candidateData);

  const candidateProfile = await createCandidateProfile({
    userId: candidateUser._id,
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

const createRecommendationJob = async ({
  companyId,
  createdBy,
  title,
  skills = ["JavaScript", "React", "Node.js"],
  location = "Pune, Maharashtra",
  employmentType = EMPLOYMENT_TYPE.FULL_TIME,
  workplaceType = WORKPLACE_TYPE.HYBRID,
  experienceLevel = EXPERIENCE_LEVEL.ENTRY,
  salaryMin = 300000,
  salaryMax = 500000,
  status = JOB_STATUS.OPEN,
}) => {
  return Job.create({
    companyId,
    createdBy,
    title,
    description:
      "This recommendation test job description is long enough for validation and matching.",
    responsibilities: ["Build production-ready application features"],
    requirements: ["Strong programming fundamentals", ...skills],
    skills,
    location,
    employmentType,
    workplaceType,
    experienceLevel,
    salaryMin,
    salaryMax,
    salaryCurrency: "INR",
    isSalaryVisible: true,
    status,
    closedAt: status === JOB_STATUS.CLOSED ? new Date() : null,
  });
};

describe("Recommendation API", () => {
  test("candidate can list recommended jobs with match information", async () => {
    const { owner, company } = await setupCompany("list");
    const { candidateSession } = await setupCandidate("list");

    const strongJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "MERN Developer",
      skills: ["JavaScript", "React", "Node.js"],
    });

    const weakJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Python Data Engineer",
      skills: ["Python", "Django", "PostgreSQL"],
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Recommended jobs fetched successfully");

    expect(response.body.data.pagination.total).toBe(2);
    expect(response.body.data.jobs).toHaveLength(2);

    const jobIds = response.body.data.jobs.map((job) => job._id);

    expect(jobIds).toEqual(
      expect.arrayContaining([
        strongJob._id.toString(),
        weakJob._id.toString(),
      ]),
    );

    expect(response.body.data.jobs[0]).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        title: expect.any(String),
        companyId: expect.objectContaining({
          _id: company._id.toString(),
          name: "HireFlow Test Company",
        }),
        match: expect.objectContaining({
          matchScore: expect.any(Number),
          matchLabel: expect.any(String),
          confidenceScore: expect.any(Number),
          confidenceLevel: expect.any(String),
          matchedSkills: expect.any(Array),
          missingSkills: expect.any(Array),
          warnings: expect.any(Array),
          calculatedAt: expect.any(String),
        }),
      }),
    );
  });

  test("recommended jobs are sorted by match score descending by default", async () => {
    const { owner, company } = await setupCompany("sort");
    const { candidateSession } = await setupCandidate("sort", {
      skills: ["javascript", "react", "node.js", "mongodb"],
      targetJobTitles: ["MERN Developer"],
      preferredLocations: ["Pune"],
      preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],
      preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    });

    const lowMatchJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Unrelated Backend Engineer",
      skills: ["Java", "Spring Boot", "Oracle"],
      location: "Delhi",
      workplaceType: WORKPLACE_TYPE.ONSITE,
    });

    const highMatchJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "MERN Developer",
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
      location: "Pune, Maharashtra",
      workplaceType: WORKPLACE_TYPE.HYBRID,
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(2);

    expect(response.body.data.jobs[0]._id).toBe(highMatchJob._id.toString());
    expect(response.body.data.jobs[1]._id).toBe(lowMatchJob._id.toString());

    expect(response.body.data.jobs[0].match.matchScore).toBeGreaterThanOrEqual(
      response.body.data.jobs[1].match.matchScore,
    );
  });

  test("candidate can filter recommended jobs by employment, workplace, experience, and location", async () => {
    const { owner, company } = await setupCompany("filters");
    const { candidateSession } = await setupCandidate("filters");

    const matchingJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Filtered MERN Role",
      employmentType: EMPLOYMENT_TYPE.FULL_TIME,
      workplaceType: WORKPLACE_TYPE.REMOTE,
      experienceLevel: EXPERIENCE_LEVEL.ENTRY,
      location: "Mumbai, Maharashtra",
    });

    await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Non Matching Contract Role",
      employmentType: EMPLOYMENT_TYPE.CONTRACT,
      workplaceType: WORKPLACE_TYPE.ONSITE,
      experienceLevel: EXPERIENCE_LEVEL.SENIOR,
      location: "Bengaluru, Karnataka",
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        employmentType: EMPLOYMENT_TYPE.FULL_TIME,
        workplaceType: WORKPLACE_TYPE.REMOTE,
        experienceLevel: EXPERIENCE_LEVEL.ENTRY,
        location: "Mumbai",
      })
      .expect(200);

    expect(response.body.data.pagination.total).toBe(1);
    expect(response.body.data.jobs).toHaveLength(1);

    expect(response.body.data.jobs[0]).toEqual(
      expect.objectContaining({
        _id: matchingJob._id.toString(),
        title: "Filtered MERN Role",
        employmentType: EMPLOYMENT_TYPE.FULL_TIME,
        workplaceType: WORKPLACE_TYPE.REMOTE,
        experienceLevel: EXPERIENCE_LEVEL.ENTRY,
        location: "Mumbai, Maharashtra",
      }),
    );
  });

  test("recommended jobs endpoint returns only open jobs", async () => {
    const { owner, company } = await setupCompany("openonly");
    const { candidateSession } = await setupCandidate("openonly");

    const openJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Open Recommended Job",
      status: JOB_STATUS.OPEN,
    });

    const closedJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Closed Recommended Job",
      status: JOB_STATUS.CLOSED,
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    const jobIds = response.body.data.jobs.map((job) => job._id);

    expect(jobIds).toContain(openJob._id.toString());
    expect(jobIds).not.toContain(closedJob._id.toString());
    expect(response.body.data.pagination.total).toBe(1);
  });

  test("recommended jobs pagination works", async () => {
    const { owner, company } = await setupCompany("page");
    const { candidateSession } = await setupCandidate("page");

    await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Page Job One",
    });

    await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Page Job Two",
    });

    await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Page Job Three",
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        page: 2,
        limit: 2,
      })
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(1);

    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  test("invalid recommendation filter returns 400", async () => {
    const { candidateSession } = await setupCandidate("badfilter");

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        employmentType: "invalid-employment-type",
      })
      .expect(400);

    expect(response.body.message).toBe("Invalid employment type");
  });

  test("candidate without profile cannot get recommended jobs", async () => {
    const candidateData = createCandidateData("noprofile");

    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(404);

    expect(response.body.message).toBe("Candidate profile not found");
  });

  test("guest cannot access recommended jobs", async () => {
    const response = await request(app)
      .get("/api/v1/recommendations/jobs")
      .expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("company admin cannot access recommended jobs", async () => {
    const { ownerSession } = await setupCompany("blockedowner");

    const response = await ownerSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("candidate can get match details for a specific open job", async () => {
    const { owner, company } = await setupCompany("match");
    const { candidateSession } = await setupCandidate("match");

    const job = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Specific Match Job",
      skills: ["JavaScript", "React", "Node.js"],
    });

    const response = await candidateSession.agent
      .get(`/api/v1/recommendations/jobs/${job._id}/match`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Job match fetched successfully");

    expect(response.body.data.job).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Specific Match Job",
      }),
    );

    expect(response.body.data.match).toEqual(
      expect.objectContaining({
        matchScore: expect.any(Number),
        matchLabel: expect.any(String),
        confidenceScore: expect.any(Number),
        confidenceLevel: expect.any(String),
        matchedSkills: expect.any(Array),
        missingSkills: expect.any(Array),
        warnings: expect.any(Array),
      }),
    );
  });

  test("specific job match rejects invalid job id", async () => {
    const { candidateSession } = await setupCandidate("badjobid");

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs/invalid-id/match")
      .expect(400);

    expect(response.body.message).toBe("Invalid job ID");
  });

  test("specific job match returns 404 for closed job", async () => {
    const { owner, company } = await setupCompany("closedmatch");
    const { candidateSession } = await setupCandidate("closedmatch");

    const closedJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Closed Match Job",
      status: JOB_STATUS.CLOSED,
    });

    const response = await candidateSession.agent
      .get(`/api/v1/recommendations/jobs/${closedJob._id}/match`)
      .expect(404);

    expect(response.body.message).toBe("Open job not found");
  });

  test("company admin cannot access specific job match", async () => {
    const { owner, company, ownerSession } =
      await setupCompany("ownerjobmatch");

    const job = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Owner Blocked Match Job",
    });

    const response = await ownerSession.agent
      .get(`/api/v1/recommendations/jobs/${job._id}/match`)
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });
});

test("recommended jobs use AI resume analysis when available", async () => {
  const { owner, company } = await setupCompany("airesume");

  const { candidateUser, candidateProfile, candidateSession } =
    await setupCandidate("airesume", {
      skills: ["React"],
      targetJobTitles: ["React Developer"],
      resumeUrl: "https://example.com/resume.pdf",
      resumePublicId: "resume-public-id",
    });

  await ResumeAnalysis.create({
    candidateUserId: candidateUser._id,
    candidateProfileId: candidateProfile._id,
    sourceType: "candidate_profile_resume",
    resumeUrl: candidateProfile.resumeUrl,
    resumePublicId: candidateProfile.resumePublicId,
    resumeSignature: "resume-signature-airesume",
    status: "completed",
    extracted: {
      skills: ["Node.js", "MongoDB", "Express.js"],
      frameworks: ["Express.js"],
      databases: ["MongoDB"],
      targetRoles: ["MERN Developer"],
      projects: [
        {
          name: "HireFlow",
          technologies: ["React", "Node.js", "MongoDB", "Express.js"],
        },
      ],
    },
    evaluation: {
      resumeScore: 82,
    },
    provider: "gemini",
    model: "gemini-test-model",
    analyzedAt: new Date(),
  });

  await createRecommendationJob({
    companyId: company._id,
    createdBy: owner._id,
    title: "Junior MERN Developer",
    skills: ["React", "Node.js", "MongoDB", "Express.js"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    location: "Pune",
  });

  const response = await candidateSession.agent
    .get("/api/v1/recommendations/jobs")
    .expect(200);

  expect(response.body.data.jobs).toHaveLength(1);

  expect(response.body.data.jobs[0].match).toEqual(
    expect.objectContaining({
      matchBasis: "profile_and_resume",
      profileScore: expect.any(Number),
      resumeBoost: expect.any(Number),
      resumeEvidence: expect.any(Array),
    }),
  );

  expect(response.body.data.jobs[0].match.resumeBoost).toBeGreaterThan(0);
});
