import request from "supertest";

import app from "../../src/app.js";

import Job from "../../src/modules/job/job.model.js";
import ResumeAnalysis from "../../src/modules/resumeAnalysis/resumeAnalysis.model.js";
import { buildCandidateProfileResumeSource } from "../../src/modules/resumeAnalysis/resumeAnalysis.service.js";

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

const createRecommendationJobsBulk = async ({
  count,
  companyId,
  createdBy,
  titlePrefix = "Bulk Recommendation Job",
  skills = ["JavaScript", "React", "Node.js"],
  location = "Pune, Maharashtra",
  employmentType = EMPLOYMENT_TYPE.FULL_TIME,
  workplaceType = WORKPLACE_TYPE.HYBRID,
  experienceLevel = EXPERIENCE_LEVEL.ENTRY,
  salaryStart = 300000,
  status = JOB_STATUS.OPEN,
}) => {
  const jobs = Array.from(
    {
      length: count,
    },
    (_, index) => ({
      companyId,
      createdBy,

      title: `${titlePrefix} ${String(index + 1).padStart(3, "0")}`,

      description:
        "This bulk recommendation test job description is long enough for validation and matching.",

      responsibilities: ["Build production-ready application features"],

      requirements: ["Strong programming fundamentals", ...skills],

      skills,
      location,
      employmentType,
      workplaceType,
      experienceLevel,

      salaryMin: salaryStart + index * 1000,
      salaryMax: salaryStart + index * 1000 + 100000,

      salaryCurrency: "INR",
      isSalaryVisible: true,

      status,

      closedAt: status === JOB_STATUS.CLOSED ? new Date() : null,
    }),
  );

  return Job.insertMany(jobs);
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

    expect(response.body.data.ranking).toEqual({
      strategy: "two_stage_exact_rerank",
      candidatePoolSize: 2,
      candidatePoolLimit: 200,
      exactScoredJobs: 2,
    });

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

    expect(response.body.data.aiResumeFit).toEqual(
      expect.objectContaining({
        hasCandidateProfile: true,
        hasResume: true,
        hasResumeInsights: false,
        canGenerate: false,
        blockReason: "missing_resume_insights",
        fit: null,

        usage: expect.objectContaining({
          featureKey: "job_resume_fit",
          limit: expect.any(Number),
          used: expect.any(Number),
          remaining: expect.any(Number),
          resetAt: expect.any(String),
        }),
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

  test("match-score recommendations score no more than the configured candidate pool", async () => {
    const { owner, company } = await setupCompany("poollimit");

    const { candidateSession } = await setupCandidate("poollimit", {
      skills: ["javascript", "react", "node.js"],

      targetJobTitles: ["MERN Developer"],

      preferredLocations: ["Pune"],

      preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],

      preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    });

    await createRecommendationJobsBulk({
      count: 205,
      companyId: company._id,
      createdBy: owner._id,
      titlePrefix: "Pool MERN Developer",
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        limit: 20,
      })
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(20);

    expect(response.body.data.ranking).toEqual({
      strategy: "two_stage_exact_rerank",
      candidatePoolSize: 200,
      candidatePoolLimit: 200,
      exactScoredJobs: 200,
    });

    expect(response.body.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 200,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  }, 30000);

  test("an older highly relevant job ranks above a newer unrelated job", async () => {
    const { owner, company } = await setupCompany("olderrelevant");

    const { candidateSession } = await setupCandidate("olderrelevant", {
      skills: ["javascript", "react", "node.js", "mongodb"],

      targetJobTitles: ["MERN Developer"],

      preferredLocations: ["Pune"],

      preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID],

      preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    });

    const relevantJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,

      title: "MERN Developer",

      skills: ["JavaScript", "React", "Node.js", "MongoDB"],

      location: "Pune, Maharashtra",

      workplaceType: WORKPLACE_TYPE.HYBRID,
    });

    await Job.updateOne(
      {
        _id: relevantJob._id,
      },
      {
        $set: {
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      },
    );

    const unrelatedJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,

      title: "Senior Java Architect",

      skills: ["Java", "Spring Boot", "Oracle"],

      location: "Delhi, India",

      workplaceType: WORKPLACE_TYPE.ONSITE,
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    expect(response.body.data.jobs[0]._id).toBe(relevantJob._id.toString());

    expect(response.body.data.jobs[0].match.matchScore).toBeGreaterThan(
      response.body.data.jobs[1].match.matchScore,
    );

    expect(response.body.data.jobs[1]._id).toBe(unrelatedJob._id.toString());
  });

  test("explicit filters are applied before the recommendation pool limit", async () => {
    const { owner, company } = await setupCompany("filterbeforepool");

    const { candidateSession } = await setupCandidate("filterbeforepool");

    await createRecommendationJobsBulk({
      count: 205,
      companyId: company._id,
      createdBy: owner._id,

      titlePrefix: "Onsite Bulk Role",

      workplaceType: WORKPLACE_TYPE.ONSITE,

      location: "Bengaluru, Karnataka",
    });

    const remoteJob = await createRecommendationJob({
      companyId: company._id,
      createdBy: owner._id,

      title: "Remote Filtered MERN Role",

      workplaceType: WORKPLACE_TYPE.REMOTE,

      location: "Mumbai, Maharashtra",
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        workplaceType: WORKPLACE_TYPE.REMOTE,
      })
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(1);

    expect(response.body.data.jobs[0]._id).toBe(remoteJob._id.toString());

    expect(response.body.data.ranking).toEqual({
      strategy: "two_stage_exact_rerank",

      candidatePoolSize: 1,
      candidatePoolLimit: 200,
      exactScoredJobs: 1,
    });

    expect(response.body.data.pagination.total).toBe(1);
  }, 30000);

  test("match-score pagination does not repeat jobs between pages", async () => {
    const { owner, company } = await setupCompany("stablepages");

    const { candidateSession } = await setupCandidate("stablepages", {
      skills: ["javascript", "react", "node.js"],

      targetJobTitles: ["MERN Developer"],
    });

    await createRecommendationJobsBulk({
      count: 25,
      companyId: company._id,
      createdBy: owner._id,
      titlePrefix: "Stable MERN Developer",
    });

    const firstPage = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        page: 1,
        limit: 10,
      })
      .expect(200);

    const secondPage = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        page: 2,
        limit: 10,
      })
      .expect(200);

    const firstPageIds = firstPage.body.data.jobs.map((job) => job._id);

    const secondPageIds = secondPage.body.data.jobs.map((job) => job._id);

    expect(firstPageIds).toHaveLength(10);
    expect(secondPageIds).toHaveLength(10);

    expect(
      firstPageIds.filter((jobId) => secondPageIds.includes(jobId)),
    ).toEqual([]);

    expect(firstPage.body.data.pagination.total).toBe(25);

    expect(secondPage.body.data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  test("equal match scores use stable created-date and job-id tie breaking", async () => {
    const { owner, company } = await setupCompany("stableties");

    const { candidateSession } = await setupCandidate("stableties", {
      skills: ["javascript", "react", "node.js"],

      targetJobTitles: ["Software Developer"],
    });

    const jobs = await createRecommendationJobsBulk({
      count: 4,
      companyId: company._id,
      createdBy: owner._id,

      titlePrefix: "Software Developer",

      skills: ["JavaScript", "React", "Node.js"],
    });

    const sameCreatedAt = new Date("2026-01-01T00:00:00.000Z");

    await Job.updateMany(
      {
        _id: {
          $in: jobs.map((job) => job._id),
        },
      },
      {
        $set: {
          title: "Software Developer",
          createdAt: sameCreatedAt,
        },
      },
    );

    const firstResponse = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    const secondResponse = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    const firstIds = firstResponse.body.data.jobs.map((job) => job._id);

    const secondIds = secondResponse.body.data.jobs.map((job) => job._id);

    const scores = firstResponse.body.data.jobs.map(
      (job) => job.match.matchScore,
    );

    expect(new Set(scores).size).toBe(1);

    expect(firstIds).toEqual(secondIds);

    expect(firstIds).toEqual(
      [...firstIds].sort((first, second) => first.localeCompare(second)),
    );
  });

  test("non-match sorting paginates in MongoDB before calculating visible match scores", async () => {
    const { owner, company } = await setupCompany("databasesort");

    const { candidateSession } = await setupCandidate("databasesort");

    await createRecommendationJobsBulk({
      count: 25,
      companyId: company._id,
      createdBy: owner._id,

      titlePrefix: "Salary Sorted Job",

      salaryStart: 300000,
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        sortBy: "salaryMin",
        order: "asc",
        page: 2,
        limit: 5,
      })
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(5);

    expect(response.body.data.ranking).toEqual({
      strategy: "database_paginated",
      candidatePoolSize: 5,
      candidatePoolLimit: 5,
      exactScoredJobs: 5,
    });

    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const salaries = response.body.data.jobs.map((job) => job.salaryMin);

    expect(salaries).toEqual([305000, 306000, 307000, 308000, 309000]);

    for (const job of response.body.data.jobs) {
      expect(job.match).toEqual(
        expect.objectContaining({
          matchScore: expect.any(Number),
          matchLabel: expect.any(String),
        }),
      );
    }
  });

  test("recommended jobs page size is capped at twenty", async () => {
    const { owner, company } = await setupCompany("maxpagesize");

    const { candidateSession } = await setupCandidate("maxpagesize");

    await createRecommendationJobsBulk({
      count: 25,
      companyId: company._id,
      createdBy: owner._id,

      titlePrefix: "Maximum Page Job",
    });

    const response = await candidateSession.agent
      .get("/api/v1/recommendations/jobs")
      .query({
        sortBy: "createdAt",
        limit: 100,
      })
      .expect(200);

    expect(response.body.data.jobs).toHaveLength(20);

    expect(response.body.data.pagination.limit).toBe(20);

    expect(response.body.data.pagination.total).toBe(25);

    expect(response.body.data.ranking).toEqual({
      strategy: "database_paginated",
      candidatePoolSize: 20,
      candidatePoolLimit: 20,
      exactScoredJobs: 20,
    });
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

  const resumeSource = buildCandidateProfileResumeSource(candidateProfile);

  await ResumeAnalysis.create({
    candidateUserId: candidateUser._id,
    candidateProfileId: candidateProfile._id,
    sourceType: resumeSource.sourceType,
    resumeUrl: resumeSource.resumeUrl,
    resumePublicId: resumeSource.resumePublicId,
    resumeSignature: resumeSource.resumeSignature,
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
