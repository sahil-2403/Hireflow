import request from "supertest";

import app from "../../src/app.js";

import { ROLES } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  postWithCsrf,
} from "../helpers/auth.helpers.js";

describe("Role-based authorization", () => {
  test("unauthenticated request cannot access protected company route", async () => {
    const response = await request(app)
      .get("/api/v1/company/recruiters")
      .expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  test("candidate cannot access company recruiter management", async () => {
    const candidate = {
      username: "authorization_candidate",
      email: "authorization.candidate@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidate);

    const { agent } = await loginUser({
      email: candidate.email,
      password: candidate.password,
    });

    const response = await agent.get("/api/v1/company/recruiters").expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("candidate cannot access managed jobs", async () => {
    const candidate = {
      username: "jobs_candidate",
      email: "jobs.candidate@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidate);

    const { agent } = await loginUser({
      email: candidate.email,
      password: candidate.password,
    });

    const response = await agent.get("/api/v1/jobs/manage").expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("company admin cannot access candidate profile routes", async () => {
    const owner = {
      username: "authorization_owner",
      email: "authorization.owner@example.com",
      password: "Password123",
      role: ROLES.OWNER,
    };

    await createVerifiedUser(owner);

    const { agent } = await loginUser({
      email: owner.email,
      password: owner.password,
    });

    const response = await agent.get("/api/v1/candidates/profile").expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("recruiter cannot apply to a job as a candidate", async () => {
    const recruiter = {
      username: "authorization_recruiter",
      email: "authorization.recruiter@example.com",
      password: "Password123",
      role: ROLES.RECRUITER,
    };

    await createVerifiedUser(recruiter);

    const { agent } = await loginUser({
      email: recruiter.email,
      password: recruiter.password,
    });

    const response = await postWithCsrf(
      agent,
      "/api/v1/applications/jobs/507f1f77bcf86cd799439011/apply",
      {
        coverLetter: "Test",
      },
      403,
    );

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });
});
