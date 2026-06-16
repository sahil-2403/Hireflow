import request from "supertest";

import app from "../../src/app.js";

import Job from "../../src/modules/job/job.model.js";

import {
  ROLES,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
} from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  authHeader,
} from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createRecruiterProfile,
} from "../helpers/business.helpers.js";

describe("Job management API", () => {
  const ownerData = {
    username: "job_owner",
    email: "job.owner@example.com",
    password: "Password123",
    role: ROLES.OWNER,
  };

  const candidateData = {
    username: "job_candidate",
    email: "job.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const validJobData = {
    title: "Junior MERN Stack Developer",
    description:
      "We are looking for a junior MERN developer to build and maintain full-stack applications.",
    responsibilities: ["Build REST APIs", "Develop React interfaces"],
    requirements: ["JavaScript fundamentals", "Basic MongoDB knowledge"],
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    location: "Pune, Maharashtra",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 300000,
    salaryMax: 500000,
    salaryCurrency: "INR",
    isSalaryVisible: true,
  };

  test("company owner creates a job for their company", async () => {
    const owner = await createVerifiedUser(ownerData);
    const company = await createCompanyForOwner(owner._id);

    const { accessToken } = await loginUser({
      email: ownerData.email,
      password: ownerData.password,
    });

    const response = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send(validJobData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(validJobData.title);

    expect(response.body.data.status).toBe(JOB_STATUS.OPEN);

    const job = await Job.findById(response.body.data._id);

    expect(job).not.toBeNull();
    expect(job.companyId.toString()).toBe(company._id.toString());
    expect(job.createdBy.toString()).toBe(owner._id.toString());
  });

  test("active recruiter creates a job for the assigned company", async () => {
    const owner = await createVerifiedUser({
      ...ownerData,
      username: "recruiter_owner",
      email: "recruiter.owner@example.com",
    });

    const company = await createCompanyForOwner(owner._id);

    const recruiterData = {
      username: "job_recruiter",
      email: "job.recruiter@example.com",
      password: "Password123",
      role: ROLES.RECRUITER,
    };

    const recruiterUser = await createVerifiedUser(recruiterData);

    await createRecruiterProfile({
      userId: recruiterUser._id,
      companyId: company._id,
      createdBy: owner._id,
    });

    const { accessToken } = await loginUser({
      email: recruiterData.email,
      password: recruiterData.password,
    });

    const response = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send({
        ...validJobData,
        title: "React Developer Intern",
      })
      .expect(201);

    expect(response.body.data.createdBy).toBe(recruiterUser._id.toString());

    expect(response.body.data.companyId).toBe(company._id.toString());
  });

  test("public listing returns only open jobs", async () => {
    const owner = await createVerifiedUser({
      ...ownerData,
      username: "public_jobs_owner",
      email: "public.jobs.owner@example.com",
    });

    await createCompanyForOwner(owner._id);

    const { accessToken } = await loginUser({
      email: "public.jobs.owner@example.com",
      password: ownerData.password,
    });

    const openJobResponse = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send({
        ...validJobData,
        title: "Open Public Job",
      })
      .expect(201);

    const closedJobResponse = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send({
        ...validJobData,
        title: "Closed Private Job",
      })
      .expect(201);

    await request(app)
      .patch(`/api/v1/jobs/${closedJobResponse.body.data._id}/status`)
      .set(authHeader(accessToken))
      .send({
        status: JOB_STATUS.CLOSED,
      })
      .expect(200);

    const response = await request(app).get("/api/v1/jobs").expect(200);

    const jobIds = response.body.data.jobs.map((job) => job._id);

    expect(jobIds).toContain(openJobResponse.body.data._id);

    expect(jobIds).not.toContain(closedJobResponse.body.data._id);
  });

  test("closing a job removes it from public job details", async () => {
    const owner = await createVerifiedUser({
      ...ownerData,
      username: "close_job_owner",
      email: "close.job.owner@example.com",
    });

    await createCompanyForOwner(owner._id);

    const { accessToken } = await loginUser({
      email: "close.job.owner@example.com",
      password: ownerData.password,
    });

    const created = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send(validJobData)
      .expect(201);

    const jobId = created.body.data._id;

    await request(app).get(`/api/v1/jobs/${jobId}`).expect(200);

    await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set(authHeader(accessToken))
      .send({
        status: JOB_STATUS.CLOSED,
      })
      .expect(200);

    await request(app).get(`/api/v1/jobs/${jobId}`).expect(404);
  });

  test("candidate cannot create a job", async () => {
    await createVerifiedUser(candidateData);

    const { accessToken } = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send(validJobData)
      .expect(403);

    expect(await Job.countDocuments()).toBe(0);
  });

  test("rejects an invalid salary range", async () => {
    const owner = await createVerifiedUser({
      ...ownerData,
      username: "salary_owner",
      email: "salary.owner@example.com",
    });

    await createCompanyForOwner(owner._id);

    const { accessToken } = await loginUser({
      email: "salary.owner@example.com",
      password: ownerData.password,
    });

    const response = await request(app)
      .post("/api/v1/jobs")
      .set(authHeader(accessToken))
      .send({
        ...validJobData,
        salaryMin: 700000,
        salaryMax: 400000,
      })
      .expect(400);

    expect(response.body.message).toBe("Validation failed");

    expect(await Job.countDocuments()).toBe(0);
  });
});
