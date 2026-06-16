import request from "supertest";

import app from "../../src/app.js";

import Application from "../../src/modules/application/application.model.js";

import { ROLES, APPLICATION_STATUS } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  authHeader,
} from "../helpers/auth.helpers.js";

import {
  createCompanyForOwner,
  createRecruiterProfile,
  createCandidateProfile,
  createOpenJob,
} from "../helpers/business.helpers.js";

describe("Application workflow API", () => {
  const ownerData = {
    username: "application_owner",
    email: "application.owner@example.com",
    password: "Password123",
    role: ROLES.OWNER,
  };

  const candidateData = {
    username: "application_candidate",
    email: "application.candidate@example.com",
    password: "Password123",
    role: ROLES.CANDIDATE,
  };

  const setupApplicationFlow = async () => {
    const owner = await createVerifiedUser(ownerData);

    const company = await createCompanyForOwner(owner._id);

    const recruiterData = {
      username: "application_recruiter",
      email: "application.recruiter@example.com",
      password: "Password123",
      role: ROLES.RECRUITER,
    };

    const recruiterUser = await createVerifiedUser(recruiterData);

    await createRecruiterProfile({
      userId: recruiterUser._id,
      companyId: company._id,
      createdBy: owner._id,
    });

    const candidateUser = await createVerifiedUser(candidateData);

    const candidateProfile = await createCandidateProfile({
      userId: candidateUser._id,
    });

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
    });

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const recruiterSession = await loginUser({
      email: recruiterData.email,
      password: recruiterData.password,
    });

    return {
      owner,
      company,
      recruiterUser,
      candidateUser,
      candidateProfile,
      job,
      candidateSession,
      recruiterSession,
    };
  };

  test("candidate applies to an open job", async () => {
    const { candidateUser, candidateProfile, company, job, candidateSession } =
      await setupApplicationFlow();

    const response = await request(app)
      .post(`/api/v1/applications/jobs/${job._id}/apply`)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "I am interested in this opportunity.",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(APPLICATION_STATUS.APPLIED);

    const application = await Application.findById(response.body.data._id);

    expect(application).not.toBeNull();

    expect(application.candidateUserId.toString()).toBe(
      candidateUser._id.toString(),
    );

    expect(application.candidateId.toString()).toBe(
      candidateProfile._id.toString(),
    );

    expect(application.companyId.toString()).toBe(company._id.toString());

    expect(application.resumeUrl).toBe(candidateProfile.resumeUrl);

    expect(application.statusHistory).toHaveLength(1);

    expect(application.statusHistory[0].status).toBe(
      APPLICATION_STATUS.APPLIED,
    );
  });

  test("duplicate application is rejected", async () => {
    const { job, candidateSession } = await setupApplicationFlow();

    const endpoint = `/api/v1/applications/jobs/${job._id}/apply`;

    await request(app)
      .post(endpoint)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "First application",
      })
      .expect(201);

    const response = await request(app)
      .post(endpoint)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "Duplicate application",
      })
      .expect(409);

    expect(response.body.message).toBe("You have already applied to this job");

    expect(await Application.countDocuments()).toBe(1);
  });

  test("candidate can list only their own applications", async () => {
    const { job, candidateSession } = await setupApplicationFlow();

    await request(app)
      .post(`/api/v1/applications/jobs/${job._id}/apply`)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "Test application",
      })
      .expect(201);

    const response = await request(app)
      .get("/api/v1/applications/me")
      .set(authHeader(candidateSession.accessToken))
      .expect(200);

    expect(response.body.data.applications).toHaveLength(1);

    expect(response.body.data.pagination.total).toBe(1);

    expect(response.body.data.applications[0].jobId.title).toEqual(
      expect.any(String),
    );
  });

  test("recruiter moves application through valid stages", async () => {
    const { job, candidateSession, recruiterSession, recruiterUser } =
      await setupApplicationFlow();

    const applicationResponse = await request(app)
      .post(`/api/v1/applications/jobs/${job._id}/apply`)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "Workflow test",
      })
      .expect(201);

    const applicationId = applicationResponse.body.data._id;

    const transitions = [
      APPLICATION_STATUS.SCREENING,
      APPLICATION_STATUS.INTERVIEW,
      APPLICATION_STATUS.OFFER,
      APPLICATION_STATUS.HIRED,
    ];

    for (const status of transitions) {
      await request(app)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set(authHeader(recruiterSession.accessToken))
        .send({
          status,
        })
        .expect(200);
    }

    const application = await Application.findById(applicationId);

    expect(application.status).toBe(APPLICATION_STATUS.HIRED);

    expect(application.reviewedBy.toString()).toBe(
      recruiterUser._id.toString(),
    );

    expect(application.statusHistory).toHaveLength(5);
  });

  test("invalid application transition is rejected", async () => {
    const { job, candidateSession, recruiterSession } =
      await setupApplicationFlow();

    const created = await request(app)
      .post(`/api/v1/applications/jobs/${job._id}/apply`)
      .set(authHeader(candidateSession.accessToken))
      .send({
        coverLetter: "Invalid transition test",
      })
      .expect(201);

    const response = await request(app)
      .patch(`/api/v1/applications/${created.body.data._id}/status`)
      .set(authHeader(recruiterSession.accessToken))
      .send({
        status: APPLICATION_STATUS.HIRED,
      })
      .expect(400);

    expect(response.body.message).toContain("Cannot move application");

    const application = await Application.findById(created.body.data._id);

    expect(application.status).toBe(APPLICATION_STATUS.APPLIED);
  });

  test("candidate cannot access managed applications", async () => {
    const { candidateSession } = await setupApplicationFlow();

    await request(app)
      .get("/api/v1/applications/manage")
      .set(authHeader(candidateSession.accessToken))
      .expect(403);
  });
});
