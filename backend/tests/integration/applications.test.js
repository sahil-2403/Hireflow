import request from "supertest";

import app from "../../src/app.js";

import Application from "../../src/modules/application/application.model.js";
import Candidate from "../../src/modules/candidate/candidate.model.js";

import {
  ROLES,
  APPLICATION_STATUS,
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
  createCandidateProfile,
  createOpenJob,
} from "../helpers/business.helpers.js";

const createOwnerData = (suffix) => ({
  username: `app_owner_${suffix}`,
  email: `app.owner.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.OWNER,
});

const createRecruiterData = (suffix) => ({
  username: `app_rec_${suffix}`,
  email: `app.rec.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.RECRUITER,
});

const createCandidateData = (suffix) => ({
  username: `app_cand_${suffix}`,
  email: `app.cand.${suffix}@example.com`,
  password: "Password123",
  role: ROLES.CANDIDATE,
});

const setupApplicationFlow = async (suffix = "base") => {
  const ownerData = createOwnerData(suffix);
  const recruiterData = createRecruiterData(suffix);
  const candidateData = createCandidateData(suffix);

  const owner = await createVerifiedUser(ownerData);
  const company = await createCompanyForOwner(owner._id);

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
    title: `Application Job ${suffix}`,
  });

  const ownerSession = await loginUser({
    email: ownerData.email,
    password: ownerData.password,
  });

  const recruiterSession = await loginUser({
    email: recruiterData.email,
    password: recruiterData.password,
  });

  const candidateSession = await loginUser({
    email: candidateData.email,
    password: candidateData.password,
  });

  return {
    owner,
    company,
    recruiterUser,
    candidateUser,
    candidateProfile,
    job,
    ownerSession,
    recruiterSession,
    candidateSession,
  };
};

const applyToJob = async ({
  agent,
  jobId,
  coverLetter = "I am interested in this opportunity.",
  expectedStatus = 201,
}) => {
  return postWithCsrf(
    agent,
    `/api/v1/applications/jobs/${jobId}/apply`,
    {
      coverLetter,
    },
    expectedStatus,
  );
};

describe("Application workflow API", () => {
  test("candidate applies to an open job and match snapshot is stored", async () => {
    const { candidateUser, candidateProfile, company, job, candidateSession } =
      await setupApplicationFlow("apply");

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "I am interested in this opportunity.",
    });

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Application submitted successfully");

    expect(response.body.data).toEqual(
      expect.objectContaining({
        status: APPLICATION_STATUS.APPLIED,
        candidateUserId: candidateUser._id.toString(),
        candidateId: candidateProfile._id.toString(),
        companyId: company._id.toString(),
        jobId: job._id.toString(),
        resumeUrl: candidateProfile.resumeUrl,
      }),
    );

    expect(response.body.data.matchSnapshot).toBeUndefined();

    const application = await Application.findById(
      response.body.data._id,
    ).select("+matchSnapshot");

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

    expect(application.matchSnapshot).toEqual(
      expect.objectContaining({
        matchScore: expect.any(Number),
        matchLabel: expect.any(String),
        confidenceScore: expect.any(Number),
        confidenceLevel: expect.any(String),
        matchedSkills: expect.any(Array),
        missingSkills: expect.any(Array),
        calculatedAt: expect.any(Date),
      }),
    );
  });

  test("duplicate application is rejected", async () => {
    const { job, candidateSession } = await setupApplicationFlow("dupe");

    await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "First application",
    });

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Duplicate application",
      expectedStatus: 409,
    });

    expect(response.body.message).toBe("You have already applied to this job");

    expect(await Application.countDocuments()).toBe(1);
  });

  test("candidate cannot apply without candidate profile", async () => {
    const { owner, company } = await setupApplicationFlow("noprof_owner");

    const candidateData = createCandidateData("noprof");
    await createVerifiedUser(candidateData);

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "No Profile Job",
    });

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      expectedStatus: 400,
    });

    expect(response.body.message).toBe(
      "Complete your candidate profile before applying",
    );

    expect(await Application.countDocuments()).toBe(0);
  });

  test("candidate cannot apply without resume", async () => {
    const { owner, company } = await setupApplicationFlow("nores_owner");

    const candidateData = createCandidateData("nores");
    const candidateUser = await createVerifiedUser(candidateData);

    await createCandidateProfile({
      userId: candidateUser._id,
      resumeUrl: null,
    });

    const candidateSession = await loginUser({
      email: candidateData.email,
      password: candidateData.password,
    });

    const job = await createOpenJob({
      companyId: company._id,
      createdBy: owner._id,
      title: "No Resume Job",
    });

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      expectedStatus: 400,
    });

    expect(response.body.message).toBe(
      "Upload or add a resume before applying",
    );

    expect(await Application.countDocuments()).toBe(0);
  });

  test("candidate cannot apply to a closed job", async () => {
    const { job, candidateSession } = await setupApplicationFlow("closed");

    job.status = JOB_STATUS.CLOSED;
    job.closedAt = new Date();
    await job.save();

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      expectedStatus: 404,
    });

    expect(response.body.message).toBe("Open job not found");

    expect(await Application.countDocuments()).toBe(0);
  });

  test("invalid job id while applying returns 400", async () => {
    const { candidateSession } = await setupApplicationFlow("badid");

    const response = await applyToJob({
      agent: candidateSession.agent,
      jobId: "invalid-id",
      expectedStatus: 400,
    });

    expect(response.body.message).toBe("Invalid job ID");
  });

  test("candidate can list only their own applications", async () => {
    const { job, candidateSession } = await setupApplicationFlow("mine");

    await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "My application",
    });

    const otherSetup = await setupApplicationFlow("othermine");

    await applyToJob({
      agent: otherSetup.candidateSession.agent,
      jobId: otherSetup.job._id,
      coverLetter: "Other candidate application",
    });

    const response = await candidateSession.agent
      .get("/api/v1/applications/me")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Applications fetched successfully");

    expect(response.body.data.applications).toHaveLength(1);
    expect(response.body.data.pagination.total).toBe(1);

    expect(response.body.data.applications[0]).toEqual(
      expect.objectContaining({
        status: APPLICATION_STATUS.APPLIED,
      }),
    );

    expect(response.body.data.applications[0].jobId).toEqual(
      expect.objectContaining({
        title: "Application Job mine",
      }),
    );
  });

  test("candidate application list rejects invalid status filter", async () => {
    const { candidateSession } = await setupApplicationFlow("badfilter");

    const response = await candidateSession.agent
      .get("/api/v1/applications/me")
      .query({
        status: "not-a-status",
      })
      .expect(400);

    expect(response.body.message).toBe("Invalid application status");
  });

  test("candidate cannot access managed applications", async () => {
    const { candidateSession } = await setupApplicationFlow("candmanage");

    const response = await candidateSession.agent
      .get("/api/v1/applications/manage")
      .expect(403);

    expect(response.body.message).toBe(
      "You are not allowed to perform this action",
    );
  });

  test("company user can list managed applications for own company", async () => {
    const { job, candidateSession, recruiterSession } =
      await setupApplicationFlow("managed");

    await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Managed application",
    });

    const response = await recruiterSession.agent
      .get("/api/v1/applications/manage")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Managed applications fetched successfully",
    );

    expect(response.body.data.pagination.total).toBe(1);
    expect(response.body.data.applications).toHaveLength(1);

    expect(response.body.data.applications[0]).toEqual(
      expect.objectContaining({
        status: APPLICATION_STATUS.APPLIED,
        match: expect.objectContaining({
          matchScore: expect.any(Number),
          matchedSkills: expect.any(Array),
          missingSkills: expect.any(Array),
        }),
      }),
    );
  });

  test("company user can list jobs with applications", async () => {
    const { job, candidateSession, ownerSession } =
      await setupApplicationFlow("jobgroups");

    await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Grouped application",
    });

    const response = await ownerSession.agent
      .get("/api/v1/applications/manage/jobs")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Application jobs fetched successfully");

    expect(response.body.data.pagination.total).toBe(1);
    expect(response.body.data.jobs).toHaveLength(1);

    expect(response.body.data.jobs[0]).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Application Job jobgroups",
        applicationCount: 1,
        bestMatch: expect.objectContaining({
          matchScore: expect.any(Number),
        }),
      }),
    );
  });

  test("company user can list applications for a specific job", async () => {
    const { job, candidateSession, recruiterSession } =
      await setupApplicationFlow("jobapps");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Job application list",
    });

    const response = await recruiterSession.agent
      .get(`/api/v1/applications/manage/jobs/${job._id}/applications`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Job applications fetched successfully");

    expect(response.body.data.job).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Application Job jobapps",
      }),
    );

    expect(response.body.data.summary.totalApplications).toBe(1);
    expect(response.body.data.applications).toHaveLength(1);

    expect(response.body.data.applications[0]).toEqual(
      expect.objectContaining({
        _id: created.body.data._id,
        status: APPLICATION_STATUS.APPLIED,
        candidate: expect.objectContaining({
          firstName: "Test",
          lastName: "Candidate",
        }),
        candidateUser: expect.objectContaining({
          email: "app.cand.jobapps@example.com",
        }),
        match: expect.objectContaining({
          matchScore: expect.any(Number),
        }),
      }),
    );
  });

  test("company user can view application details for a specific job", async () => {
    const { job, candidateSession, ownerSession } =
      await setupApplicationFlow("detail");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Application details test",
    });

    const response = await ownerSession.agent
      .get(
        `/api/v1/applications/manage/jobs/${job._id}/applications/${created.body.data._id}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Application details fetched successfully",
    );

    expect(response.body.data.application).toEqual(
      expect.objectContaining({
        _id: created.body.data._id,
        status: APPLICATION_STATUS.APPLIED,
        coverLetter: "Application details test",
      }),
    );

    expect(response.body.data.candidate).toEqual(
      expect.objectContaining({
        firstName: "Test",
        lastName: "Candidate",
      }),
    );

    expect(response.body.data.job).toEqual(
      expect.objectContaining({
        _id: job._id.toString(),
        title: "Application Job detail",
      }),
    );

    expect(response.body.data.match).toEqual(
      expect.objectContaining({
        matchScore: expect.any(Number),
        matchedSkills: expect.any(Array),
        missingSkills: expect.any(Array),
      }),
    );

    expect(response.body.data.allowedNextStatuses).toEqual(
      expect.arrayContaining([
        APPLICATION_STATUS.SCREENING,
        APPLICATION_STATUS.REJECTED,
      ]),
    );
  });

  test("company user cannot view another company's application details", async () => {
    const firstSetup = await setupApplicationFlow("firstco");
    const secondSetup = await setupApplicationFlow("secondco");

    const secondApplication = await applyToJob({
      agent: secondSetup.candidateSession.agent,
      jobId: secondSetup.job._id,
      coverLetter: "Second company application",
    });

    const response = await firstSetup.ownerSession.agent
      .get(
        `/api/v1/applications/manage/jobs/${secondSetup.job._id}/applications/${secondApplication.body.data._id}`,
      )
      .expect(404);

    expect(response.body.message).toBe("Job not found");
  });

  test("recruiter moves application through valid stages", async () => {
    const { job, candidateSession, recruiterSession, recruiterUser } =
      await setupApplicationFlow("flow");

    const applicationResponse = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Workflow test",
    });

    const applicationId = applicationResponse.body.data._id;

    const transitions = [
      APPLICATION_STATUS.SCREENING,
      APPLICATION_STATUS.INTERVIEW,
      APPLICATION_STATUS.OFFER,
      APPLICATION_STATUS.HIRED,
    ];

    for (const status of transitions) {
      await patchWithCsrf(
        recruiterSession.agent,
        `/api/v1/applications/${applicationId}/status`,
        {
          status,
        },
        200,
      );
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
      await setupApplicationFlow("invalidflow");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Invalid transition test",
    });

    const response = await patchWithCsrf(
      recruiterSession.agent,
      `/api/v1/applications/${created.body.data._id}/status`,
      {
        status: APPLICATION_STATUS.HIRED,
      },
      400,
    );

    expect(response.body.message).toContain("Cannot move application");

    const application = await Application.findById(created.body.data._id);

    expect(application.status).toBe(APPLICATION_STATUS.APPLIED);
  });

  test("same application status update is rejected", async () => {
    const { job, candidateSession, ownerSession } =
      await setupApplicationFlow("samestatus");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
    });

    const response = await patchWithCsrf(
      ownerSession.agent,
      `/api/v1/applications/${created.body.data._id}/status`,
      {
        status: APPLICATION_STATUS.APPLIED,
      },
      400,
    );

    expect(response.body.message).toBe("Application already has this status");
  });

  test("invalid application id while updating status returns 400", async () => {
    const { ownerSession } = await setupApplicationFlow("badappid");

    const response = await patchWithCsrf(
      ownerSession.agent,
      "/api/v1/applications/invalid-id/status",
      {
        status: APPLICATION_STATUS.SCREENING,
      },
      400,
    );

    expect(response.body.message).toBe("Invalid application ID");
  });

  test("company user can fetch managed application resume metadata through resume route", async () => {
    const { job, candidateSession, ownerSession } =
      await setupApplicationFlow("resume");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Resume view test",
    });

    global.fetch = async () => {
      return {
        ok: true,
        arrayBuffer: async () => Buffer.from("%PDF-1.4 test resume"),
      };
    };

    const response = await ownerSession.agent
      .get(`/api/v1/applications/manage/${created.body.data._id}/resume/view`)
      .expect(200);

    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      "Test-Candidate-resume.pdf",
    );
  });

  test("resume route returns 404 when application resume is missing", async () => {
    const { job, candidateSession, ownerSession, candidateProfile } =
      await setupApplicationFlow("res404");

    const created = await applyToJob({
      agent: candidateSession.agent,
      jobId: job._id,
      coverLetter: "Missing resume route test",
    });

    await Candidate.findByIdAndUpdate(candidateProfile._id, {
      resumeUrl: null,
    });

    const response = await ownerSession.agent
      .get(`/api/v1/applications/manage/${created.body.data._id}/resume/view`)
      .expect(404);

    expect(response.body.message).toBe("Resume not found");
  });
});
