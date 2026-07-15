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
  postWithCsrf,
  patchWithCsrf,
} from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createRecruiterProfile,
  createOpenJob,
} from "../helpers/business.helpers.js";

const buildJobData = (overrides = {}) => {
  return {
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
    ...overrides,
  };
};

const setupOwnerWithCompany = async (suffix = "default") => {
  const ownerData = {
    username: `job_owner_${suffix}`,
    email: `job.owner.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.OWNER,
  };

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

  const session = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  return {
    owner,
    company,
    ownerData,
    session,
  };
};

const setupRecruiterWithCompany = async (suffix = "default") => {
  const { owner, company } = await setupOwnerWithCompany(`ro_${suffix}`);

  const recruiterData = {
    username: `job_recruiter_${suffix}`,
    email: `job.recruiter.${suffix}@example.com`,
    password: "Password123",
    role: ROLES.RECRUITER,
  };

  const recruiterUser = await createVerifiedUser(recruiterData);

  const recruiterProfile = await createRecruiterProfile({
    userId: recruiterUser._id,
    companyId: company._id,
    createdBy: owner._id,
  });

  const session = await loginUser({
    email: recruiterData.email,
    password: recruiterData.password,
  });

  return {
    owner,
    company,
    recruiterData,
    recruiterUser,
    recruiterProfile,
    session,
  };
};

describe("Job management API", () => {
  test("company admin creates a job for their company", async () => {
    const { owner, company, session } = await setupOwnerWithCompany("create");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData(),
      201,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Job created successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        title: "Junior MERN Stack Developer",
        status: JOB_STATUS.OPEN,
        companyId: company._id.toString(),
        createdBy: owner._id.toString(),
      }),
    );

    const job = await Job.findById(response.body.data._id);

    expect(job).not.toBeNull();
    expect(job.companyId.toString()).toBe(company._id.toString());
    expect(job.createdBy.toString()).toBe(owner._id.toString());
  });

  test("active recruiter creates a job for the assigned company", async () => {
    const { company, recruiterUser, session } =
      await setupRecruiterWithCompany("create");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData({
        title: "React Developer Intern",
      }),
      201,
    );

    expect(response.body.success).toBe(true);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        title: "React Developer Intern",
        companyId: company._id.toString(),
        createdBy: recruiterUser._id.toString(),
        status: JOB_STATUS.OPEN,
      }),
    );
  });

  test("candidate cannot create a job", async () => {
    const candidateData = {
      username: "job_candidate",
      email: "job.candidate@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidateData);

    const session = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData(),
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );

    expect(await Job.countDocuments()).toBe(0);
  });

  test("rejects an invalid salary range while creating a job", async () => {
    const { session } = await setupOwnerWithCompany("invalid_salary");

    const response = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData({
        salaryMin: 700000,
        salaryMax: 400000,
      }),
      400,
    );

    expect(response.body.message).toBe("Validation failed");

    expect(await Job.countDocuments()).toBe(0);
  });

  test("public listing returns only open jobs", async () => {
    const { owner, company, session } =
      await setupOwnerWithCompany("public_listing");

    const openJobResponse = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData({
        title: "Open Public Job",
      }),
      201,
    );

    const closedJobResponse = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData({
        title: "Closed Private Job",
      }),
      201,
    );

    await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${closedJobResponse.body.data._id}/status`,
      {
        status: JOB_STATUS.CLOSED,
      },
      200,
    );

    const response = await request(app).get("/api/v1/jobs").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.total).toBe(1);

    const jobIds = response.body.data.jobs.map((job) => job._id);

    expect(jobIds).toContain(openJobResponse.body.data._id);
    expect(jobIds).not.toContain(closedJobResponse.body.data._id);

    const openJob = response.body.data.jobs[0];

    expect(openJob.companyId).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        name: "HireFlow Test Company",
      }),
    );

    const savedClosedJob = await Job.findById(closedJobResponse.body.data._id);

    expect(savedClosedJob.companyId.toString()).toBe(company._id.toString());
    expect(savedClosedJob.createdBy.toString()).toBe(owner._id.toString());
  });

  test("public job details returns open job details", async () => {
    const { owner, company } = await setupOwnerWithCompany("public_details");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Public Detail Job",
    });

    const response = await request(app)
      .get(`/api/v1/jobs/${job._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Job fetched successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Public Detail Job",
        status: JOB_STATUS.OPEN,
      }),
    );

    expect(response.body.data.companyId).toEqual(
      expect.objectContaining({
        _id: company._id.toString(),
        name: "HireFlow Test Company",
      }),
    );

    expect(response.body.data.createdBy).toBeUndefined();
  });

  test("closed job is hidden from public job details", async () => {
    const { company, session } = await setupOwnerWithCompany("closed_details");

    const created = await postWithCsrf(
      session.agent,
      "/api/v1/jobs",
      buildJobData({
        title: "Closed Detail Job",
      }),
      201,
    );

    const jobId = created.body.data._id;

    await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${jobId}/status`,
      {
        status: JOB_STATUS.CLOSED,
      },
      200,
    );

    const response = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .expect(404);

    expect(response.body.message).toBe("Open job not found");

    const savedJob = await Job.findById(jobId);

    expect(savedJob.companyId.toString()).toBe(company._id.toString());
    expect(savedJob.status).toBe(JOB_STATUS.CLOSED);
    expect(savedJob.closedAt).toBeInstanceOf(Date);
  });

  test("invalid public job id returns 400", async () => {
    const response = await request(app)
      .get("/api/v1/jobs/invalid-id")
      .expect(400);

    expect(response.body.message).toBe("Invalid job ID");
  });

  test("invalid public job filter returns 400", async () => {
    const response = await request(app)
      .get("/api/v1/jobs")
      .query({
        employmentType: "invalid-employment-type",
      })
      .expect(400);

    expect(response.body.message).toBe("Invalid employment type");
  });

  test("company admin can list only their managed company jobs", async () => {
    const firstSetup = await setupOwnerWithCompany("managed_first");
    const secondSetup = await setupOwnerWithCompany("managed_second");

    const firstCompanyJob = await createOpenJob({
      companyId: firstSetup.company._id,
      createdBy: firstSetup.owner._id,
      title: "First Company Managed Job",
    });

    await createOpenJob({
      companyId: secondSetup.company._id,
      createdBy: secondSetup.owner._id,
      title: "Second Company Managed Job",
    });

    const response = await firstSetup.session.agent
      .get("/api/v1/jobs/manage")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Managed jobs fetched successfully");

    expect(response.body.data.pagination.total).toBe(1);

    expect(response.body.data.jobs[0]).toEqual(
      expect.objectContaining({
        _id: firstCompanyJob._id.toString(),
        title: "First Company Managed Job",
        companyId: firstSetup.company._id.toString(),
      }),
    );
  });

  test("company admin can get a managed job by id", async () => {
    const { owner, company, session } =
      await setupOwnerWithCompany("managed_detail");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Managed Detail Job",
    });

    const response = await session.agent
      .get(`/api/v1/jobs/manage/${job._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Managed job fetched successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Managed Detail Job",
        companyId: company._id.toString(),
      }),
    );

    expect(response.body.data.createdBy).toEqual(
      expect.objectContaining({
        _id: owner._id.toString(),
        email: "job.owner.managed_detail@example.com",
        role: ROLES.OWNER,
      }),
    );
  });

  test("company admin cannot get another company's managed job", async () => {
    const firstSetup = await setupOwnerWithCompany("other_access_first");
    const secondSetup = await setupOwnerWithCompany("other_access_second");

    const secondCompanyJob = await createOpenJob({
      companyId: secondSetup.company._id,
      createdBy: secondSetup.owner._id,
      title: "Second Company Secret Job",
    });

    const response = await firstSetup.session.agent
      .get(`/api/v1/jobs/manage/${secondCompanyJob._id}`)
      .expect(404);

    expect(response.body.message).toBe("Job not found");
  });

  test("company admin can update own company job", async () => {
    const { owner, company, session } = await setupOwnerWithCompany("update");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Original Job Title",
    });

    const response = await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${job._id}`,
      {
        title: "Updated Job Title",
        salaryMin: 400000,
        salaryMax: 800000,
      },
      200,
    );

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Job updated successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Updated Job Title",
        salaryMin: 400000,
        salaryMax: 800000,
      }),
    );

    const savedJob = await Job.findById(job._id);

    expect(savedJob.title).toBe("Updated Job Title");
    expect(savedJob.companyId.toString()).toBe(company._id.toString());
  });

  test("company admin cannot update another company's job", async () => {
    const firstSetup = await setupOwnerWithCompany("update_other_first");
    const secondSetup = await setupOwnerWithCompany("update_other_second");

    const secondCompanyJob = await createOpenJob({
      companyId: secondSetup.company._id,
      createdBy: secondSetup.owner._id,
      title: "Other Company Job",
    });

    const response = await patchWithCsrf(
      firstSetup.session.agent,
      `/api/v1/jobs/${secondCompanyJob._id}`,
      {
        title: "Illegal Update",
      },
      404,
    );

    expect(response.body.message).toBe("Job not found");

    const savedJob = await Job.findById(secondCompanyJob._id);

    expect(savedJob.title).toBe("Other Company Job");
  });

  test("company admin can close and reopen own job", async () => {
    const { owner, company, session } = await setupOwnerWithCompany("status");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Status Change Job",
    });

    const closeResponse = await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${job._id}/status`,
      {
        status: JOB_STATUS.CLOSED,
      },
      200,
    );

    expect(closeResponse.body.message).toBe("Job closed successfully");
    expect(closeResponse.body.data.status).toBe(JOB_STATUS.CLOSED);
    expect(closeResponse.body.data.closedAt).toEqual(expect.any(String));

    const reopenResponse = await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${job._id}/status`,
      {
        status: JOB_STATUS.OPEN,
      },
      200,
    );

    expect(reopenResponse.body.message).toBe("Job opened successfully");
    expect(reopenResponse.body.data.status).toBe(JOB_STATUS.OPEN);
    expect(reopenResponse.body.data.closedAt).toBeNull();
  });

  test("rejects invalid status update value", async () => {
    const { owner, company, session } =
      await setupOwnerWithCompany("invalid_status");

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Invalid Status Job",
    });

    const response = await patchWithCsrf(
      session.agent,
      `/api/v1/jobs/${job._id}/status`,
      {
        status: "paused",
      },
      400,
    );

    expect(response.body.message).toBe("Validation failed");
  });
});
