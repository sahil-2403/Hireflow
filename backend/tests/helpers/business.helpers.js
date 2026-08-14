import Company from "../../src/modules/company/company.model.js";
import Recruiter from "../../src/modules/recruiter/recruiter.model.js";
import Candidate from "../../src/modules/candidate/candidate.model.js";
import Job from "../../src/modules/job/job.model.js";

import {
  COMPANY_SIZE,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
} from "../../src/config/constants.js";

const createCompanyForOwner = async (ownerId) => {
  return Company.create({
    name: "HireFlow Test Company",
    ownerId,
    industry: "Software Development",
    companySize: COMPANY_SIZE.ELEVEN_TO_FIFTY,
    headquarters: "Pune, Maharashtra",
    description: "Company created for automated tests.",
  });
};

const createRecruiterProfile = async ({ userId, companyId, createdBy }) => {
  return Recruiter.create({
    userId,
    companyId,
    firstName: "Test",
    lastName: "Recruiter",
    jobTitle: "Technical Recruiter",
    isActive: true,
    createdBy,
  });
};

const createCandidateProfile = async ({
  userId,
  resumeUrl = "https://example.com/test-resume.pdf",
}) => {
  return Candidate.create({
    userId,
    firstName: "Test",
    lastName: "Candidate",
    headline: "Junior MERN Developer",
    summary: "Candidate profile for automated tests.",
    skills: ["javascript", "react", "node.js"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune, Maharashtra",
    resumeUrl,
  });
};

const createOpenJob = async ({
  companyId,
  createdBy,
  title = "Junior MERN Developer",
}) => {
  return Job.create({
    companyId,
    createdBy,
    title,
    description:
      "This job description is long enough to satisfy the validation rules.",
    responsibilities: ["Build APIs"],
    requirements: ["JavaScript fundamentals"],
    skills: ["JavaScript", "React", "Node.js"],
    location: "Pune, Maharashtra",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 300000,
    salaryMax: 500000,
    salaryCurrency: "INR",
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  });
};

const buildTestMatchSnapshot = (overrides = {}) => {
  return {
    matchScore: 70,
    matchLabel: "Strong match",
    confidenceScore: 80,
    confidenceLevel: "high",
    breakdown: {},
    matchedSkills: [],
    missingSkills: [],
    extraCandidateSkills: [],
    reasons: [],
    warnings: [],
    calculatedAt: new Date(),
    ...overrides,
  };
};

export {
  createCompanyForOwner,
  createRecruiterProfile,
  createCandidateProfile,
  createOpenJob,
  buildTestMatchSnapshot,
};
