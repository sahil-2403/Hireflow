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
  createCandidateProfile,
  createOpenJob,
} from "../helpers/business.helpers.js";

describe("Analytics API", () => {
  test("company overview returns correct job and application totals", async () => {
    const owner = await createVerifiedUser({
      username: "analytics_owner",
      email: "analytics.owner@example.com",
      password: "Password123",
      role: ROLES.OWNER,
    });

    const company = await createCompanyForOwner(owner._id);

    const candidateUser = await createVerifiedUser({
      username: "analytics_candidate",
      email: "analytics.candidate@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    });

    const candidateProfile = await createCandidateProfile({
      userId: candidateUser._id,
    });

    const firstJob = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Analytics Job One",
    });

    await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "Analytics Job Two",
    });

    await Application.create({
      jobId: firstJob._id,
      candidateId: candidateProfile._id,
      candidateUserId: candidateUser._id,
      companyId: company._id,
      resumeUrl: candidateProfile.resumeUrl,
      status: APPLICATION_STATUS.HIRED,
      statusHistory: [
        {
          status: APPLICATION_STATUS.APPLIED,
          changedBy: candidateUser._id,
        },
        {
          status: APPLICATION_STATUS.HIRED,
          changedBy: owner._id,
        },
      ],
      reviewedBy: owner._id,
    });

    const { accessToken } = await loginUser({
      email: "analytics.owner@example.com",
      password: "Password123",
    });

    const response = await request(app)
      .get("/api/v1/analytics/company/overview")
      .set(authHeader(accessToken))
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.jobs).toEqual({
      totalJobs: 2,
      openJobs: 2,
      closedJobs: 0,
    });

    expect(response.body.data.applications.totalApplications).toBe(1);

    expect(response.body.data.applications.uniqueCandidates).toBe(1);

    expect(response.body.data.applications.hiredCandidates).toBe(1);

    expect(response.body.data.recentApplications).toHaveLength(1);
  });

  test("candidate overview returns application counts and profile completion", async () => {
    const owner = await createVerifiedUser({
      username: "candidate_analytics_owner",
      email: "candidate.analytics.owner@example.com",
      password: "Password123",
      role: ROLES.OWNER,
    });

    const company = await createCompanyForOwner(owner._id);

    const candidate = await createVerifiedUser({
      username: "candidate_analytics",
      email: "candidate.analytics@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    });

    const profile = await createCandidateProfile({
      userId: candidate._id,
    });

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
    });

    await Application.create({
      jobId: job._id,
      candidateId: profile._id,
      candidateUserId: candidate._id,
      companyId: company._id,
      resumeUrl: profile.resumeUrl,
      status: APPLICATION_STATUS.APPLIED,
      statusHistory: [
        {
          status: APPLICATION_STATUS.APPLIED,
          changedBy: candidate._id,
        },
      ],
    });

    const { accessToken } = await loginUser({
      email: "candidate.analytics@example.com",
      password: "Password123",
    });

    const response = await request(app)
      .get("/api/v1/analytics/candidate/overview")
      .set(authHeader(accessToken))
      .expect(200);

    expect(response.body.data.totalApplications).toBe(1);

    const appliedStage = response.body.data.applicationsByStatus.find(
      (item) => item.status === APPLICATION_STATUS.APPLIED,
    );

    expect(appliedStage.count).toBe(1);

    expect(response.body.data.profile.profileCompletionPercentage).toEqual(
      expect.any(Number),
    );

    expect(response.body.data.recentApplications).toHaveLength(1);
  });
});
