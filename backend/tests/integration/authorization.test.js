import request from "supertest";

import app from "../../src/app.js";

import { ROLES } from "../../src/config/constants.js";

import {
  createVerifiedUser,
  loginUser,
  authHeader,
} from "../helpers/auth.helpers.js";

describe("Role-based authorization", () => {
  test("candidate cannot access company recruiter management", async () => {
    const candidate = {
      username: "authorization_candidate",
      email: "authorization.candidate@example.com",
      password: "Password123",
      role: ROLES.CANDIDATE,
    };

    await createVerifiedUser(candidate);

    const { accessToken } = await loginUser({
      email: candidate.email,
      password: candidate.password,
    });

    const response = await request(app)
      .get("/api/v1/company/recruiters")
      .set(authHeader(accessToken))
      .expect(403);

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

    const { accessToken } = await loginUser({
      email: candidate.email,
      password: candidate.password,
    });

    await request(app)
      .get("/api/v1/jobs/manage")
      .set(authHeader(accessToken))
      .expect(403);
  });

  test("company owner cannot access candidate profile routes", async () => {
    const owner = {
      username: "authorization_owner",
      email: "authorization.owner@example.com",
      password: "Password123",
      role: ROLES.OWNER,
    };

    await createVerifiedUser(owner);

    const { accessToken } = await loginUser({
      email: owner.email,
      password: owner.password,
    });

    await request(app)
      .get("/api/v1/candidates/profile")
      .set(authHeader(accessToken))
      .expect(403);
  });

  test("recruiter cannot apply to a job as a candidate", async () => {
    const recruiter = {
      username: "authorization_recruiter",
      email: "authorization.recruiter@example.com",
      password: "Password123",
      role: ROLES.RECRUITER,
    };

    await createVerifiedUser(recruiter);

    const { accessToken } = await loginUser({
      email: recruiter.email,
      password: recruiter.password,
    });

    await request(app)
      .post("/api/v1/applications/jobs/507f1f77bcf86cd799439011/apply")
      .set(authHeader(accessToken))
      .send({
        coverLetter: "Test",
      })
      .expect(403);
  });
});
