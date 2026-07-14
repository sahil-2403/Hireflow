import "dotenv/config";

import mongoose from "mongoose";

import connectDB from "../config/database.js";

import User from "../modules/auth/auth.model.js";
import Candidate from "../modules/candidate/candidate.model.js";
import Company from "../modules/company/company.model.js";
import Recruiter from "../modules/recruiter/recruiter.model.js";
import Job from "../modules/job/job.model.js";
import Application from "../modules/application/application.model.js";

import {
  APPLICATION_STATUS,
  COMPANY_SIZE,
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  JOB_STATUS,
  ROLES,
  WORKPLACE_TYPE,
} from "../config/constants.js";

import { calculateJobCandidateMatch } from "../shared/services/matchScore.service.js";

const DEMO_DOMAIN = "hireflow.demo";
const DEMO_PASSWORD = "Demo@1234";
const RESET_FLAG = process.argv.includes("--reset");

const demoCompanyNames = [
  "TechNova Solutions",
  "GreenGrid Energy",
  "CareBridge Health",
  "QuietSeed Labs",
];

const daysAgo = (days) => {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

const getDemoEmail = (name) => `${name}@${DEMO_DOMAIN}`;

const buildResumeUrl = (slug) => {
  return `https://example.com/hireflow-demo/resumes/${slug}.pdf`;
};

const buildProfilePhotoUrl = (slug) => {
  return `https://i.pravatar.cc/160?u=hireflow-${slug}`;
};

const buildCompanyLogoUrl = (text) => {
  return `https://placehold.co/160x160/2563eb/ffffff?text=${encodeURIComponent(
    text,
  )}`;
};

const printSeedSummary = ({
  users,
  companies,
  recruiters,
  candidates,
  jobs,
  applications,
}) => {
  console.log("\nDemo seed completed successfully.");
  console.log("--------------------------------------------------");
  console.log(`Users: ${users}`);
  console.log(`Companies: ${companies}`);
  console.log(`Recruiters: ${recruiters}`);
  console.log(`Candidates: ${candidates}`);
  console.log(`Jobs: ${jobs}`);
  console.log(`Applications: ${applications}`);
  console.log("--------------------------------------------------");
  console.log("Shared demo password:", DEMO_PASSWORD);
  console.log("\nUseful login accounts:");
  console.log("Company admin:", getDemoEmail("owner.technova"));
  console.log("Recruiter:", getDemoEmail("recruiter.technova1"));
  console.log("Candidate high-match:", getDemoEmail("candidate.aarav"));
  console.log("Candidate no-resume edge case:", getDemoEmail("candidate.tina"));
  console.log("--------------------------------------------------\n");
};

const ensureSafeEnvironment = () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing. Add it to backend/.env before seeding.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data while NODE_ENV=production.");
  }
};

const getExistingDemoData = async () => {
  const demoUsers = await User.find({
    email: new RegExp(`@${DEMO_DOMAIN}$`),
  })
    .select("_id")
    .lean();

  const demoUserIds = demoUsers.map((user) => user._id);

  const demoCompanies = await Company.find({
    $or: [
      { name: { $in: demoCompanyNames } },
      { ownerId: { $in: demoUserIds } },
    ],
  })
    .select("_id")
    .lean();

  const demoCompanyIds = demoCompanies.map((company) => company._id);

  const demoCandidates = await Candidate.find({
    userId: { $in: demoUserIds },
  })
    .select("_id")
    .lean();

  const demoCandidateIds = demoCandidates.map((candidate) => candidate._id);

  const demoJobs = await Job.find({
    $or: [
      { companyId: { $in: demoCompanyIds } },
      { createdBy: { $in: demoUserIds } },
    ],
  })
    .select("_id")
    .lean();

  const demoJobIds = demoJobs.map((job) => job._id);

  return {
    demoUserIds,
    demoCompanyIds,
    demoCandidateIds,
    demoJobIds,
  };
};

const resetDemoData = async () => {
  const { demoUserIds, demoCompanyIds, demoCandidateIds, demoJobIds } =
    await getExistingDemoData();

  await Application.deleteMany({
    $or: [
      { candidateUserId: { $in: demoUserIds } },
      { companyId: { $in: demoCompanyIds } },
      { candidateId: { $in: demoCandidateIds } },
      { jobId: { $in: demoJobIds } },
    ],
  });

  await Job.deleteMany({
    $or: [
      { _id: { $in: demoJobIds } },
      { companyId: { $in: demoCompanyIds } },
      { createdBy: { $in: demoUserIds } },
    ],
  });

  await Recruiter.deleteMany({
    $or: [
      { userId: { $in: demoUserIds } },
      { companyId: { $in: demoCompanyIds } },
      { createdBy: { $in: demoUserIds } },
    ],
  });

  await Candidate.deleteMany({
    userId: { $in: demoUserIds },
  });

  await Company.deleteMany({
    $or: [
      { _id: { $in: demoCompanyIds } },
      { name: { $in: demoCompanyNames } },
    ],
  });

  await User.deleteMany({
    _id: { $in: demoUserIds },
  });

  console.log("Existing HireFlow demo data removed.");
};

const ensureDemoDataDoesNotExist = async () => {
  const existingDemoUser = await User.exists({
    email: new RegExp(`@${DEMO_DOMAIN}$`),
  });

  const existingDemoCompany = await Company.exists({
    name: { $in: demoCompanyNames },
  });

  if (existingDemoUser || existingDemoCompany) {
    throw new Error(
      "Demo data already exists. Run npm run seed:demo:reset to replace it safely.",
    );
  }
};

const ownerSeeds = [
  {
    key: "owner-technova",
    username: "owner_technova",
    email: getDemoEmail("owner.technova"),
    profilePhotoUrl: buildProfilePhotoUrl("owner-technova"),
    company: {
      key: "technova",
      name: "TechNova Solutions",
      logoUrl: buildCompanyLogoUrl("TN"),
      industry: "Software Development",
      companySize: COMPANY_SIZE.FIFTY_ONE_TO_TWO_HUNDRED,
      websiteUrl: "https://technova.example.com",
      headquarters: "Pune, India",
      description:
        "A product engineering company building MERN, cloud, and automation solutions for growing teams.",
    },
  },
  {
    key: "owner-greengrid",
    username: "owner_greengrid",
    email: getDemoEmail("owner.greengrid"),
    profilePhotoUrl: buildProfilePhotoUrl("owner-greengrid"),
    company: {
      key: "greengrid",
      name: "GreenGrid Energy",
      logoUrl: buildCompanyLogoUrl("GG"),
      industry: "Renewable Energy",
      companySize: COMPANY_SIZE.TWO_HUNDRED_ONE_TO_FIVE_HUNDRED,
      websiteUrl: "https://greengrid.example.com",
      headquarters: "Bengaluru, India",
      description:
        "A renewable energy company hiring technology and operations teams for smart energy products.",
    },
  },
  {
    key: "owner-carebridge",
    username: "owner_carebridge",
    email: getDemoEmail("owner.carebridge"),
    profilePhotoUrl: buildProfilePhotoUrl("owner-carebridge"),
    company: {
      key: "carebridge",
      name: "CareBridge Health",
      logoUrl: buildCompanyLogoUrl("CB"),
      industry: "Healthcare Technology",
      companySize: COMPANY_SIZE.ELEVEN_TO_FIFTY,
      websiteUrl: "https://carebridge.example.com",
      headquarters: "Mumbai, India",
      description:
        "A healthcare technology startup improving patient workflows, mobile health access, and secure care operations.",
    },
  },
  {
    key: "owner-quietseed",
    username: "owner_quietseed",
    email: getDemoEmail("owner.quietseed"),
    profilePhotoUrl: null,
    company: {
      key: "quietseed",
      name: "QuietSeed Labs",
      logoUrl: null,
      industry: "Early Stage Startup",
      companySize: COMPANY_SIZE.ONE_TO_TEN,
      websiteUrl: null,
      headquarters: "Remote, India",
      description:
        "A small startup profile intentionally seeded with no jobs to test empty company dashboard states.",
    },
  },
];

const recruiterSeeds = [
  {
    key: "recruiter-technova-1",
    companyKey: "technova",
    createdByKey: "owner-technova",
    username: "recruiter_technova1",
    email: getDemoEmail("recruiter.technova1"),
    firstName: "Ritika",
    lastName: "Deshmukh",
    phone: "+91 90000 10001",
    jobTitle: "Technical Recruiter",
    isActive: true,
  },
  {
    key: "recruiter-technova-2",
    companyKey: "technova",
    createdByKey: "owner-technova",
    username: "recruiter_technova2",
    email: getDemoEmail("recruiter.technova2"),
    firstName: "Naman",
    lastName: "Bose",
    phone: "+91 90000 10002",
    jobTitle: "Recruitment Coordinator",
    isActive: false,
  },
  {
    key: "recruiter-greengrid-1",
    companyKey: "greengrid",
    createdByKey: "owner-greengrid",
    username: "recruiter_greengrid1",
    email: getDemoEmail("recruiter.greengrid1"),
    firstName: "Ananya",
    lastName: "Rao",
    phone: "+91 90000 20001",
    jobTitle: "Senior Recruiter",
    isActive: true,
  },
  {
    key: "recruiter-greengrid-2",
    companyKey: "greengrid",
    createdByKey: "owner-greengrid",
    username: "recruiter_greengrid2",
    email: getDemoEmail("recruiter.greengrid2"),
    firstName: "Kunal",
    lastName: "Verma",
    phone: "+91 90000 20002",
    jobTitle: "Talent Partner",
    isActive: true,
  },
  {
    key: "recruiter-carebridge-1",
    companyKey: "carebridge",
    createdByKey: "owner-carebridge",
    username: "recruiter_carebridge1",
    email: getDemoEmail("recruiter.carebridge1"),
    firstName: "Farah",
    lastName: "Khan",
    phone: "+91 90000 30001",
    jobTitle: "Healthcare Talent Partner",
    isActive: true,
  },
  {
    key: "recruiter-carebridge-2",
    companyKey: "carebridge",
    createdByKey: "owner-carebridge",
    username: "recruiter_carebridge2",
    email: getDemoEmail("recruiter.carebridge2"),
    firstName: "Dev",
    lastName: "Kapoor",
    phone: "+91 90000 30002",
    jobTitle: "Recruiter",
    isActive: false,
  },
  {
    key: "recruiter-quietseed-1",
    companyKey: "quietseed",
    createdByKey: "owner-quietseed",
    username: "recruiter_quietseed1",
    email: getDemoEmail("recruiter.quietseed1"),
    firstName: "Ira",
    lastName: "Sethi",
    phone: "+91 90000 40001",
    jobTitle: "Founding Recruiter",
    isActive: true,
  },
  {
    key: "recruiter-quietseed-2",
    companyKey: "quietseed",
    createdByKey: "owner-quietseed",
    username: "recruiter_quietseed2",
    email: getDemoEmail("recruiter.quietseed2"),
    firstName: "Jay",
    lastName: "Malhotra",
    phone: "+91 90000 40002",
    jobTitle: "Recruiter",
    isActive: false,
  },
];

const candidateSeeds = [
  {
    key: "candidate-aarav",
    username: "candidate_aarav",
    email: getDemoEmail("candidate.aarav"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-aarav"),
    firstName: "Aarav",
    lastName: "Sharma",
    phone: "+91 80000 10001",
    headline: "MERN Stack Developer with cloud deployment experience",
    summary:
      "Full stack developer focused on React, Node.js, Express, MongoDB, API design, authentication, and production-ready dashboards.",
    skills: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JavaScript",
      "TypeScript",
      "Tailwind CSS",
      "AWS",
    ],
    experienceLevel: EXPERIENCE_LEVEL.MID,
    location: "Pune, India",
    targetJobTitles: [
      "Full Stack Developer",
      "MERN Developer",
      "React Node Developer",
    ],
    preferredLocations: ["Pune, India", "Bengaluru, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: buildResumeUrl("aarav-sharma"),
    linkedinUrl: "https://linkedin.com/in/aarav-demo",
    githubUrl: "https://github.com/aarav-demo",
    portfolioUrl: "https://aarav-demo.example.com",
  },
  {
    key: "candidate-priya",
    username: "candidate_priya",
    email: getDemoEmail("candidate.priya"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-priya"),
    firstName: "Priya",
    lastName: "Nair",
    phone: "+91 80000 10002",
    headline: "Frontend developer looking for React internships",
    summary:
      "Entry-level frontend developer with strong fundamentals in HTML, CSS, JavaScript, React, responsive layouts, and UI implementation.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS", "Git"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Bengaluru, India",
    targetJobTitles: ["Frontend Developer", "React Intern", "Frontend Intern"],
    preferredLocations: ["Bengaluru, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.REMOTE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.INTERNSHIP,
      EMPLOYMENT_TYPE.FULL_TIME,
    ],
    resumeUrl: buildResumeUrl("priya-nair"),
    linkedinUrl: "https://linkedin.com/in/priya-demo",
    githubUrl: "https://github.com/priya-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-rohan",
    username: "candidate_rohan",
    email: getDemoEmail("candidate.rohan"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-rohan"),
    firstName: "Rohan",
    lastName: "Mehta",
    phone: "+91 80000 10003",
    headline: "Senior backend engineer specializing in scalable Node services",
    summary:
      "Backend engineer with experience in Node.js, Express, MongoDB, Redis, Docker, AWS, queue-based systems, and API performance.",
    skills: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "Redis",
      "Docker",
      "AWS",
      "System Design",
      "REST APIs",
    ],
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    location: "Mumbai, India",
    targetJobTitles: [
      "Senior Backend Engineer",
      "Node.js Engineer",
      "API Platform Engineer",
    ],
    preferredLocations: ["Mumbai, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.REMOTE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("rohan-mehta"),
    linkedinUrl: "https://linkedin.com/in/rohan-demo",
    githubUrl: "https://github.com/rohan-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-neha",
    username: "candidate_neha",
    email: getDemoEmail("candidate.neha"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-neha"),
    firstName: "Neha",
    lastName: "Iyer",
    phone: "+91 80000 10004",
    headline: "Data analyst with SQL and dashboarding skills",
    summary:
      "Data analyst skilled in SQL, Python, Excel, Tableau, Power BI, reporting automation, and business performance dashboards.",
    skills: ["SQL", "Python", "Excel", "Tableau", "Power BI", "Data Cleaning"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Bengaluru, India",
    targetJobTitles: ["Data Analyst", "Business Analyst", "Reporting Analyst"],
    preferredLocations: ["Bengaluru, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: buildResumeUrl("neha-iyer"),
    linkedinUrl: "https://linkedin.com/in/neha-demo",
    githubUrl: null,
    portfolioUrl: null,
  },
  {
    key: "candidate-vikram",
    username: "candidate_vikram",
    email: getDemoEmail("candidate.vikram"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-vikram"),
    firstName: "Vikram",
    lastName: "Singh",
    phone: "+91 80000 10005",
    headline: "Lead DevOps engineer for AWS and Kubernetes platforms",
    summary:
      "DevOps lead with hands-on experience in AWS, Docker, Kubernetes, CI/CD, Terraform, Linux, monitoring, and platform reliability.",
    skills: [
      "AWS",
      "Docker",
      "Kubernetes",
      "Terraform",
      "Linux",
      "CI/CD",
      "Monitoring",
      "GitHub Actions",
    ],
    experienceLevel: EXPERIENCE_LEVEL.LEAD,
    location: "Bengaluru, India",
    targetJobTitles: [
      "DevOps Lead",
      "Cloud Infrastructure Engineer",
      "Platform Engineer",
    ],
    preferredLocations: ["Bengaluru, India", "Remote"],
    preferredWorkplaceTypes: [
      WORKPLACE_TYPE.ONSITE,
      WORKPLACE_TYPE.REMOTE,
      WORKPLACE_TYPE.HYBRID,
    ],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("vikram-singh"),
    linkedinUrl: "https://linkedin.com/in/vikram-demo",
    githubUrl: "https://github.com/vikram-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-meera",
    username: "candidate_meera",
    email: getDemoEmail("candidate.meera"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-meera"),
    firstName: "Meera",
    lastName: "Joshi",
    phone: "+91 80000 10006",
    headline: "Product designer focused on UX systems",
    summary:
      "Product designer experienced in Figma, UX research, design systems, wireframes, usability testing, and developer handoff.",
    skills: [
      "Figma",
      "UX Research",
      "UI Design",
      "Wireframing",
      "Design Systems",
      "Prototyping",
    ],
    experienceLevel: EXPERIENCE_LEVEL.MID,
    location: "Pune, India",
    targetJobTitles: ["Product Designer", "UX Designer", "UI UX Designer"],
    preferredLocations: ["Pune, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("meera-joshi"),
    linkedinUrl: "https://linkedin.com/in/meera-demo",
    githubUrl: null,
    portfolioUrl: "https://meera-design.example.com",
  },
  {
    key: "candidate-kabir",
    username: "candidate_kabir",
    email: getDemoEmail("candidate.kabir"),
    profilePhotoUrl: null,
    firstName: "Kabir",
    lastName: "Khan",
    phone: "+91 80000 10007",
    headline: "MERN stack intern with strong JavaScript fundamentals",
    summary:
      "Junior developer practicing React, Node.js, Express, MongoDB, authentication flows, Git, and REST API integration.",
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
    ],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune, India",
    targetJobTitles: ["MERN Intern", "Junior Web Developer", "Frontend Intern"],
    preferredLocations: ["Pune, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.REMOTE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.INTERNSHIP,
      EMPLOYMENT_TYPE.FULL_TIME,
    ],
    resumeUrl: buildResumeUrl("kabir-khan"),
    linkedinUrl: null,
    githubUrl: "https://github.com/kabir-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-aisha",
    username: "candidate_aisha",
    email: getDemoEmail("candidate.aisha"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-aisha"),
    firstName: "Aisha",
    lastName: "Qureshi",
    phone: "+91 80000 10008",
    headline: "QA automation engineer with Cypress and Playwright",
    summary:
      "QA engineer experienced in Cypress, Playwright, Selenium, JavaScript, API testing, regression suites, and release quality workflows.",
    skills: [
      "Cypress",
      "Playwright",
      "Selenium",
      "JavaScript",
      "API Testing",
      "Postman",
      "Regression Testing",
    ],
    experienceLevel: EXPERIENCE_LEVEL.MID,
    location: "Hyderabad, India",
    targetJobTitles: ["QA Automation Engineer", "Test Automation Engineer"],
    preferredLocations: ["Hyderabad, India", "Bengaluru, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("aisha-qureshi"),
    linkedinUrl: "https://linkedin.com/in/aisha-demo",
    githubUrl: "https://github.com/aisha-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-aditya",
    username: "candidate_aditya",
    email: getDemoEmail("candidate.aditya"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-aditya"),
    firstName: "Aditya",
    lastName: "Rao",
    phone: "+91 80000 10009",
    headline: "Senior mobile app developer",
    summary:
      "Mobile engineer experienced in Flutter, React Native, Android, iOS, Firebase, app performance, and cross-platform releases.",
    skills: [
      "Flutter",
      "React Native",
      "Android",
      "iOS",
      "Firebase",
      "Mobile Performance",
    ],
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    location: "Remote, India",
    targetJobTitles: [],
    preferredLocations: [],
    preferredWorkplaceTypes: [],
    preferredEmploymentTypes: [],
    resumeUrl: buildResumeUrl("aditya-rao"),
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
  },
  {
    key: "candidate-sana",
    username: "candidate_sana",
    email: getDemoEmail("candidate.sana"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-sana"),
    firstName: "Sana",
    lastName: "Shaikh",
    phone: "+91 80000 10010",
    headline: "HR recruiter with sourcing and screening experience",
    summary:
      "Recruiter experienced in sourcing, screening, stakeholder coordination, interview scheduling, ATS workflows, and candidate communication.",
    skills: [
      "Sourcing",
      "Screening",
      "Interview Coordination",
      "ATS",
      "HRMS",
      "Candidate Communication",
    ],
    experienceLevel: EXPERIENCE_LEVEL.MID,
    location: "Mumbai, India",
    targetJobTitles: ["HR Recruiter", "Talent Acquisition Specialist"],
    preferredLocations: ["Mumbai, India", "Pune, India"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.ONSITE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [EMPLOYMENT_TYPE.FULL_TIME],
    resumeUrl: buildResumeUrl("sana-shaikh"),
    linkedinUrl: "https://linkedin.com/in/sana-demo",
    githubUrl: null,
    portfolioUrl: null,
  },
  {
    key: "candidate-omkar",
    username: "candidate_omkar",
    email: getDemoEmail("candidate.omkar"),
    profilePhotoUrl: null,
    firstName: "Omkar",
    lastName: "Patil",
    phone: "+91 80000 10011",
    headline: "Junior backend developer",
    summary:
      "Junior backend developer learning APIs, Node.js, Express, MongoDB, Git, and clean MVC structure.",
    skills: ["Node.js", "Express.js", "MongoDB", "JavaScript", "Git"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Pune, India",
    targetJobTitles: ["Junior Backend Developer", "Node.js Intern"],
    preferredLocations: ["Pune, India"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.ONSITE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.INTERNSHIP,
    ],
    resumeUrl: buildResumeUrl("omkar-patil"),
    linkedinUrl: null,
    githubUrl: "https://github.com/omkar-demo",
    portfolioUrl: null,
  },
  {
    key: "candidate-kavya",
    username: "candidate_kavya",
    email: getDemoEmail("candidate.kavya"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-kavya"),
    firstName: "Kavya",
    lastName: "Menon",
    phone: "+91 80000 10012",
    headline: "Lead full stack engineer for SaaS products",
    summary:
      "Lead engineer with deep experience in React, Node.js, MongoDB, TypeScript, AWS, architecture, mentoring, and production SaaS delivery.",
    skills: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "TypeScript",
      "AWS",
      "System Design",
      "Leadership",
    ],
    experienceLevel: EXPERIENCE_LEVEL.LEAD,
    location: "Remote, India",
    targetJobTitles: [
      "Lead Full Stack Engineer",
      "Engineering Lead",
      "Senior MERN Developer",
    ],
    preferredLocations: ["Remote", "Pune, India", "Bengaluru, India"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.REMOTE, WORKPLACE_TYPE.HYBRID],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("kavya-menon"),
    linkedinUrl: "https://linkedin.com/in/kavya-demo",
    githubUrl: "https://github.com/kavya-demo",
    portfolioUrl: "https://kavya-demo.example.com",
  },
  {
    key: "candidate-farhan",
    username: "candidate_farhan",
    email: getDemoEmail("candidate.farhan"),
    profilePhotoUrl: buildProfilePhotoUrl("candidate-farhan"),
    firstName: "Farhan",
    lastName: "Ali",
    phone: "+91 80000 10013",
    headline: "Security analyst with cloud and application security experience",
    summary:
      "Security analyst skilled in vulnerability assessment, cloud security, SIEM workflows, incident response, Linux, and secure application reviews.",
    skills: [
      "Cloud Security",
      "SIEM",
      "Linux",
      "Incident Response",
      "Vulnerability Assessment",
      "Application Security",
    ],
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    location: "Mumbai, India",
    targetJobTitles: ["Security Analyst", "Cloud Security Analyst"],
    preferredLocations: ["Mumbai, India", "Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.HYBRID, WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.CONTRACT,
    ],
    resumeUrl: buildResumeUrl("farhan-ali"),
    linkedinUrl: "https://linkedin.com/in/farhan-demo",
    githubUrl: null,
    portfolioUrl: null,
  },
  {
    key: "candidate-tina",
    username: "candidate_tina",
    email: getDemoEmail("candidate.tina"),
    profilePhotoUrl: null,
    firstName: "Tina",
    lastName: "D'Souza",
    phone: "+91 80000 10014",
    headline: "Content marketer testing no-resume candidate edge case",
    summary:
      "Candidate profile intentionally has no resume URL to test resume-required states and application readiness warnings.",
    skills: ["Content Writing", "SEO", "Copywriting", "Social Media"],
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    location: "Goa, India",
    targetJobTitles: ["Content Marketer", "SEO Writer"],
    preferredLocations: ["Remote"],
    preferredWorkplaceTypes: [WORKPLACE_TYPE.REMOTE],
    preferredEmploymentTypes: [
      EMPLOYMENT_TYPE.FULL_TIME,
      EMPLOYMENT_TYPE.PART_TIME,
    ],
    resumeUrl: null,
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
  },
];

const jobSeeds = [
  {
    key: "technova-fullstack",
    companyKey: "technova",
    createdByKey: "recruiter-technova-1",
    title: "Full Stack MERN Developer",
    description:
      "Build production-grade MERN features, dashboards, authentication flows, and REST APIs for customer-facing SaaS products.",
    responsibilities: [
      "Build React and Node.js features",
      "Create REST APIs and reusable frontend components",
      "Work with MongoDB models and deployment workflows",
    ],
    requirements: [
      "Strong JavaScript and React knowledge",
      "Experience with Node.js, Express, and MongoDB",
      "Understanding of authentication and API security",
    ],
    skills: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JavaScript",
      "TypeScript",
      "Tailwind CSS",
    ],
    location: "Pune, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 800000,
    salaryMax: 1400000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "technova-frontend-intern",
    companyKey: "technova",
    createdByKey: "recruiter-technova-1",
    title: "Frontend React Intern",
    description:
      "Assist the frontend team with React components, responsive UI, Tailwind styling, and page-level integration work.",
    responsibilities: [
      "Build UI components",
      "Fix responsive bugs",
      "Work with React forms and routing",
    ],
    requirements: [
      "HTML and CSS fundamentals",
      "Basic JavaScript",
      "React learning experience",
    ],
    skills: ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS"],
    location: "Bengaluru, India",
    employmentType: EMPLOYMENT_TYPE.INTERNSHIP,
    workplaceType: WORKPLACE_TYPE.REMOTE,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 20000,
    salaryMax: 35000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "technova-backend-senior",
    companyKey: "technova",
    createdByKey: "owner-technova",
    title: "Senior Backend Engineer",
    description:
      "Design scalable backend APIs, data models, background workflows, and performance improvements for high-traffic services.",
    responsibilities: [
      "Design backend APIs",
      "Optimize MongoDB queries",
      "Improve backend reliability",
    ],
    requirements: [
      "Node.js and Express experience",
      "MongoDB performance knowledge",
      "Docker or cloud deployment experience",
    ],
    skills: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "Redis",
      "Docker",
      "AWS",
      "REST APIs",
    ],
    location: "Mumbai, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.REMOTE,
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    salaryMin: null,
    salaryMax: null,
    isSalaryVisible: false,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "technova-devops-lead",
    companyKey: "technova",
    createdByKey: "recruiter-technova-1",
    title: "DevOps Lead",
    description:
      "Lead cloud infrastructure, deployment pipelines, Kubernetes operations, monitoring, and platform reliability initiatives.",
    responsibilities: [
      "Own CI/CD workflows",
      "Manage Kubernetes clusters",
      "Improve observability",
    ],
    requirements: [
      "AWS production experience",
      "Kubernetes and Docker knowledge",
      "Terraform or infrastructure-as-code experience",
    ],
    skills: [
      "AWS",
      "Docker",
      "Kubernetes",
      "Terraform",
      "CI/CD",
      "Linux",
      "Monitoring",
    ],
    location: "Bengaluru, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.ONSITE,
    experienceLevel: EXPERIENCE_LEVEL.LEAD,
    salaryMin: 2200000,
    salaryMax: 3200000,
    isSalaryVisible: true,
    status: JOB_STATUS.CLOSED,
    closedAt: daysAgo(8),
  },
  {
    key: "technova-qa-automation",
    companyKey: "technova",
    createdByKey: "recruiter-technova-1",
    title: "QA Automation Engineer",
    description:
      "Create reliable automated test suites for web applications, API workflows, release validation, and regression coverage.",
    responsibilities: [
      "Write Cypress and Playwright tests",
      "Maintain regression suites",
      "Collaborate with developers on quality gates",
    ],
    requirements: [
      "Automation testing experience",
      "JavaScript knowledge",
      "API testing basics",
    ],
    skills: ["Cypress", "Playwright", "Selenium", "JavaScript", "API Testing"],
    location: "Hyderabad, India",
    employmentType: EMPLOYMENT_TYPE.CONTRACT,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 700000,
    salaryMax: 1100000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "technova-junior-backend",
    companyKey: "technova",
    createdByKey: "owner-technova",
    title: "Junior Backend Developer",
    description:
      "Work with senior engineers to build backend APIs, MongoDB queries, authentication middleware, and structured Express modules.",
    responsibilities: [
      "Build small API features",
      "Write backend validations",
      "Learn clean MVC structure",
    ],
    requirements: [
      "Basic Node.js knowledge",
      "JavaScript fundamentals",
      "MongoDB basics",
    ],
    skills: ["Node.js", "Express.js", "MongoDB", "JavaScript", "Git"],
    location: "Pune, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.ONSITE,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 350000,
    salaryMax: null,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "greengrid-data-analyst",
    companyKey: "greengrid",
    createdByKey: "recruiter-greengrid-1",
    title: "Data Analyst",
    description:
      "Analyze business, energy, and operational datasets to build dashboards, reports, insights, and performance summaries.",
    responsibilities: [
      "Create dashboards",
      "Clean and analyze data",
      "Share weekly performance insights",
    ],
    requirements: [
      "SQL knowledge",
      "Excel reporting experience",
      "Dashboarding tool experience",
    ],
    skills: ["SQL", "Python", "Excel", "Tableau", "Power BI"],
    location: "Bengaluru, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: 450000,
    salaryMax: 750000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "greengrid-cloud-infra",
    companyKey: "greengrid",
    createdByKey: "recruiter-greengrid-2",
    title: "Cloud Infrastructure Engineer",
    description:
      "Build cloud infrastructure, automated deployments, monitoring, and reliability improvements for energy technology systems.",
    responsibilities: [
      "Manage cloud infrastructure",
      "Improve deployment pipelines",
      "Monitor platform health",
    ],
    requirements: [
      "AWS experience",
      "Terraform experience",
      "Docker and Kubernetes knowledge",
    ],
    skills: ["AWS", "Terraform", "Kubernetes", "Docker", "Linux", "Monitoring"],
    location: "Remote",
    employmentType: EMPLOYMENT_TYPE.CONTRACT,
    workplaceType: WORKPLACE_TYPE.REMOTE,
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    salaryMin: 1600000,
    salaryMax: 2600000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "greengrid-product-designer",
    companyKey: "greengrid",
    createdByKey: "owner-greengrid",
    title: "Product Designer",
    description:
      "Design dashboards, workflows, and operational tools for internal teams and energy customers using research-driven UX practices.",
    responsibilities: [
      "Create wireframes",
      "Run usability reviews",
      "Maintain design systems",
    ],
    requirements: [
      "Figma experience",
      "UX research understanding",
      "Portfolio of product design work",
    ],
    skills: [
      "Figma",
      "UX Research",
      "UI Design",
      "Wireframing",
      "Design Systems",
    ],
    location: "Pune, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 900000,
    salaryMax: 1500000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "greengrid-ops-coordinator",
    companyKey: "greengrid",
    createdByKey: "recruiter-greengrid-1",
    title: "Field Operations Coordinator",
    description:
      "Coordinate field schedules, vendor communication, operational checklists, and site reporting for energy deployment projects.",
    responsibilities: [
      "Coordinate field activities",
      "Maintain reports",
      "Communicate with vendors",
    ],
    requirements: ["Good communication", "Spreadsheet knowledge"],
    skills: ["Operations", "Excel"],
    location: "Jaipur, India",
    employmentType: EMPLOYMENT_TYPE.PART_TIME,
    workplaceType: WORKPLACE_TYPE.ONSITE,
    experienceLevel: EXPERIENCE_LEVEL.ENTRY,
    salaryMin: null,
    salaryMax: 250000,
    isSalaryVisible: true,
    status: JOB_STATUS.CLOSED,
    closedAt: daysAgo(15),
  },
  {
    key: "greengrid-frontend-dashboard",
    companyKey: "greengrid",
    createdByKey: "recruiter-greengrid-2",
    title: "Frontend Dashboard Developer",
    description:
      "Build React dashboards for analytics, charts, filters, operational workflows, and responsive internal tools.",
    responsibilities: [
      "Build dashboard UI",
      "Connect APIs",
      "Improve frontend performance",
    ],
    requirements: [
      "React experience",
      "JavaScript knowledge",
      "Dashboard UI experience",
    ],
    skills: [
      "React",
      "JavaScript",
      "Tailwind CSS",
      "Charts",
      "API Integration",
    ],
    location: "Bengaluru, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 900000,
    salaryMax: 1300000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "carebridge-fullstack",
    companyKey: "carebridge",
    createdByKey: "recruiter-carebridge-1",
    title: "Healthcare Full Stack Engineer",
    description:
      "Build secure healthcare web workflows, patient-facing features, dashboards, APIs, and data-driven internal tools.",
    responsibilities: [
      "Build full stack features",
      "Work on secure patient workflows",
      "Create dashboard APIs",
    ],
    requirements: [
      "React and Node.js experience",
      "MongoDB knowledge",
      "Security-minded development",
    ],
    skills: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JavaScript",
      "Security",
    ],
    location: "Mumbai, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 1000000,
    salaryMax: 1800000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "carebridge-mobile",
    companyKey: "carebridge",
    createdByKey: "owner-carebridge",
    title: "Mobile App Developer",
    description:
      "Build mobile healthcare experiences for Android and iOS using cross-platform tools, Firebase integrations, and performance optimization.",
    responsibilities: [
      "Build mobile features",
      "Integrate Firebase services",
      "Improve mobile performance",
    ],
    requirements: [
      "Flutter or React Native experience",
      "Mobile release experience",
      "API integration skills",
    ],
    skills: [
      "Flutter",
      "React Native",
      "Firebase",
      "Android",
      "iOS",
      "Mobile Performance",
    ],
    location: "Remote",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.REMOTE,
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    salaryMin: 1500000,
    salaryMax: 2300000,
    isSalaryVisible: false,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "carebridge-security",
    companyKey: "carebridge",
    createdByKey: "recruiter-carebridge-1",
    title: "Security Analyst",
    description:
      "Support healthcare application security, vulnerability assessment, SIEM alerts, incident response, and cloud security reviews.",
    responsibilities: [
      "Monitor security alerts",
      "Run vulnerability assessments",
      "Support incident response",
    ],
    requirements: [
      "Security operations experience",
      "Linux knowledge",
      "Cloud security understanding",
    ],
    skills: [
      "Cloud Security",
      "SIEM",
      "Linux",
      "Incident Response",
      "Vulnerability Assessment",
      "Application Security",
    ],
    location: "Mumbai, India",
    employmentType: EMPLOYMENT_TYPE.CONTRACT,
    workplaceType: WORKPLACE_TYPE.HYBRID,
    experienceLevel: EXPERIENCE_LEVEL.SENIOR,
    salaryMin: 1300000,
    salaryMax: 2100000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "carebridge-hr-recruiter",
    companyKey: "carebridge",
    createdByKey: "recruiter-carebridge-1",
    title: "HR Recruiter",
    description:
      "Manage hiring pipelines, sourcing, screening, interview coordination, candidate communication, and ATS updates.",
    responsibilities: [
      "Source candidates",
      "Coordinate interviews",
      "Maintain ATS records",
    ],
    requirements: [
      "Recruiting experience",
      "Strong communication",
      "Interview coordination skills",
    ],
    skills: [
      "Sourcing",
      "Screening",
      "Interview Coordination",
      "ATS",
      "Candidate Communication",
    ],
    location: "Mumbai, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.ONSITE,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 500000,
    salaryMax: 850000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
  {
    key: "carebridge-qa-health",
    companyKey: "carebridge",
    createdByKey: "owner-carebridge",
    title: "Healthcare QA Automation Engineer",
    description:
      "Automate testing for healthcare web and mobile workflows, API integrations, release checks, and regression suites.",
    responsibilities: [
      "Create automated tests",
      "Validate release workflows",
      "Test API integrations",
    ],
    requirements: [
      "Cypress or Playwright experience",
      "API testing knowledge",
      "Healthcare domain awareness preferred",
    ],
    skills: [
      "Cypress",
      "Playwright",
      "API Testing",
      "Postman",
      "Regression Testing",
    ],
    location: "Hyderabad, India",
    employmentType: EMPLOYMENT_TYPE.FULL_TIME,
    workplaceType: WORKPLACE_TYPE.REMOTE,
    experienceLevel: EXPERIENCE_LEVEL.MID,
    salaryMin: 850000,
    salaryMax: 1250000,
    isSalaryVisible: true,
    status: JOB_STATUS.OPEN,
  },
];

const applicationSeeds = [
  ["technova-fullstack", "candidate-aarav", APPLICATION_STATUS.INTERVIEW, 24],
  ["technova-fullstack", "candidate-kavya", APPLICATION_STATUS.SCREENING, 18],
  ["technova-fullstack", "candidate-omkar", APPLICATION_STATUS.REJECTED, 14],
  ["technova-fullstack", "candidate-meera", APPLICATION_STATUS.APPLIED, 7],

  ["technova-frontend-intern", "candidate-priya", APPLICATION_STATUS.OFFER, 26],
  [
    "technova-frontend-intern",
    "candidate-kabir",
    APPLICATION_STATUS.SCREENING,
    17,
  ],
  [
    "technova-frontend-intern",
    "candidate-aarav",
    APPLICATION_STATUS.APPLIED,
    3,
  ],

  [
    "technova-backend-senior",
    "candidate-rohan",
    APPLICATION_STATUS.INTERVIEW,
    31,
  ],
  ["technova-backend-senior", "candidate-kavya", APPLICATION_STATUS.OFFER, 19],
  [
    "technova-backend-senior",
    "candidate-omkar",
    APPLICATION_STATUS.REJECTED,
    12,
  ],

  ["technova-devops-lead", "candidate-vikram", APPLICATION_STATUS.HIRED, 35],
  ["technova-devops-lead", "candidate-rohan", APPLICATION_STATUS.REJECTED, 25],
  ["technova-devops-lead", "candidate-aarav", APPLICATION_STATUS.SCREENING, 15],

  [
    "technova-qa-automation",
    "candidate-aisha",
    APPLICATION_STATUS.INTERVIEW,
    20,
  ],
  ["technova-qa-automation", "candidate-kabir", APPLICATION_STATUS.APPLIED, 8],
  [
    "technova-qa-automation",
    "candidate-omkar",
    APPLICATION_STATUS.SCREENING,
    6,
  ],

  ["technova-junior-backend", "candidate-omkar", APPLICATION_STATUS.OFFER, 22],
  ["technova-junior-backend", "candidate-kabir", APPLICATION_STATUS.APPLIED, 5],
  [
    "technova-junior-backend",
    "candidate-priya",
    APPLICATION_STATUS.SCREENING,
    4,
  ],

  [
    "greengrid-data-analyst",
    "candidate-neha",
    APPLICATION_STATUS.SCREENING,
    21,
  ],
  ["greengrid-data-analyst", "candidate-aarav", APPLICATION_STATUS.APPLIED, 11],
  ["greengrid-data-analyst", "candidate-meera", APPLICATION_STATUS.REJECTED, 9],

  ["greengrid-cloud-infra", "candidate-vikram", APPLICATION_STATUS.OFFER, 23],
  [
    "greengrid-cloud-infra",
    "candidate-rohan",
    APPLICATION_STATUS.SCREENING,
    13,
  ],
  ["greengrid-cloud-infra", "candidate-aditya", APPLICATION_STATUS.APPLIED, 10],

  [
    "greengrid-product-designer",
    "candidate-meera",
    APPLICATION_STATUS.INTERVIEW,
    16,
  ],
  [
    "greengrid-product-designer",
    "candidate-priya",
    APPLICATION_STATUS.REJECTED,
    6,
  ],

  [
    "greengrid-ops-coordinator",
    "candidate-sana",
    APPLICATION_STATUS.APPLIED,
    30,
  ],
  [
    "greengrid-frontend-dashboard",
    "candidate-priya",
    APPLICATION_STATUS.HIRED,
    28,
  ],
  [
    "greengrid-frontend-dashboard",
    "candidate-kabir",
    APPLICATION_STATUS.SCREENING,
    12,
  ],
  [
    "greengrid-frontend-dashboard",
    "candidate-aisha",
    APPLICATION_STATUS.APPLIED,
    5,
  ],

  ["carebridge-fullstack", "candidate-aarav", APPLICATION_STATUS.OFFER, 32],
  ["carebridge-fullstack", "candidate-kavya", APPLICATION_STATUS.INTERVIEW, 20],
  ["carebridge-fullstack", "candidate-rohan", APPLICATION_STATUS.APPLIED, 6],

  ["carebridge-mobile", "candidate-aditya", APPLICATION_STATUS.INTERVIEW, 18],
  ["carebridge-mobile", "candidate-kavya", APPLICATION_STATUS.SCREENING, 9],

  ["carebridge-security", "candidate-farhan", APPLICATION_STATUS.SCREENING, 17],
  ["carebridge-security", "candidate-vikram", APPLICATION_STATUS.APPLIED, 8],
  ["carebridge-security", "candidate-rohan", APPLICATION_STATUS.REJECTED, 5],

  ["carebridge-hr-recruiter", "candidate-sana", APPLICATION_STATUS.OFFER, 19],
  ["carebridge-hr-recruiter", "candidate-meera", APPLICATION_STATUS.APPLIED, 4],

  ["carebridge-qa-health", "candidate-aisha", APPLICATION_STATUS.HIRED, 29],
  ["carebridge-qa-health", "candidate-kabir", APPLICATION_STATUS.REJECTED, 11],
  ["carebridge-qa-health", "candidate-omkar", APPLICATION_STATUS.APPLIED, 3],
].map(([jobKey, candidateKey, status, appliedDaysAgo]) => ({
  jobKey,
  candidateKey,
  status,
  appliedDaysAgo,
  coverLetter:
    status === APPLICATION_STATUS.APPLIED
      ? "I am interested in this opportunity and would like to be considered for the role."
      : "I believe my skills and experience align with this role. I would be excited to contribute to your team and continue through the hiring process.",
}));

const statusFlowByFinalStatus = {
  [APPLICATION_STATUS.APPLIED]: [APPLICATION_STATUS.APPLIED],
  [APPLICATION_STATUS.SCREENING]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SCREENING,
  ],
  [APPLICATION_STATUS.INTERVIEW]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.INTERVIEW,
  ],
  [APPLICATION_STATUS.OFFER]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.OFFER,
  ],
  [APPLICATION_STATUS.HIRED]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.OFFER,
    APPLICATION_STATUS.HIRED,
  ],
  [APPLICATION_STATUS.REJECTED]: [
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.REJECTED,
  ],
};

const buildStatusHistory = ({ finalStatus, reviewerId, appliedAt }) => {
  const flow = statusFlowByFinalStatus[finalStatus] || [
    APPLICATION_STATUS.APPLIED,
  ];

  return flow.map((status, index) => ({
    status,
    changedBy: index === 0 ? null : reviewerId,
    changedAt: addDays(appliedAt, index * 2),
  }));
};

const createUsers = async (userMap) => {
  for (const ownerSeed of ownerSeeds) {
    const user = await User.create({
      username: ownerSeed.username,
      email: ownerSeed.email,
      password: DEMO_PASSWORD,
      role: ROLES.OWNER,
      isEmailVerified: true,
      isActive: true,
      profilePhotoUrl: ownerSeed.profilePhotoUrl,
    });

    userMap.set(ownerSeed.key, user);
  }

  for (const recruiterSeed of recruiterSeeds) {
    const user = await User.create({
      username: recruiterSeed.username,
      email: recruiterSeed.email,
      password: DEMO_PASSWORD,
      role: ROLES.RECRUITER,
      isEmailVerified: true,
      isActive: recruiterSeed.isActive,
      profilePhotoUrl: buildProfilePhotoUrl(recruiterSeed.key),
    });

    userMap.set(recruiterSeed.key, user);
  }

  for (const candidateSeed of candidateSeeds) {
    const user = await User.create({
      username: candidateSeed.username,
      email: candidateSeed.email,
      password: DEMO_PASSWORD,
      role: ROLES.CANDIDATE,
      isEmailVerified: true,
      isActive: true,
      profilePhotoUrl: candidateSeed.profilePhotoUrl,
    });

    userMap.set(candidateSeed.key, user);
  }
};

const createCompanies = async ({ userMap, companyMap }) => {
  for (const ownerSeed of ownerSeeds) {
    const company = await Company.create({
      ...ownerSeed.company,
      ownerId: userMap.get(ownerSeed.key)._id,
    });

    companyMap.set(ownerSeed.company.key, company);
  }
};

const createRecruiters = async ({ userMap, companyMap, recruiterMap }) => {
  for (const recruiterSeed of recruiterSeeds) {
    const recruiter = await Recruiter.create({
      userId: userMap.get(recruiterSeed.key)._id,
      companyId: companyMap.get(recruiterSeed.companyKey)._id,
      firstName: recruiterSeed.firstName,
      lastName: recruiterSeed.lastName,
      phone: recruiterSeed.phone,
      jobTitle: recruiterSeed.jobTitle,
      isActive: recruiterSeed.isActive,
      createdBy: userMap.get(recruiterSeed.createdByKey)._id,
    });

    recruiterMap.set(recruiterSeed.key, recruiter);
  }
};

const createCandidates = async ({ userMap, candidateMap }) => {
  for (const candidateSeed of candidateSeeds) {
    const candidate = await Candidate.create({
      userId: userMap.get(candidateSeed.key)._id,
      firstName: candidateSeed.firstName,
      lastName: candidateSeed.lastName,
      phone: candidateSeed.phone,
      headline: candidateSeed.headline,
      summary: candidateSeed.summary,
      skills: candidateSeed.skills,
      experienceLevel: candidateSeed.experienceLevel,
      location: candidateSeed.location,
      targetJobTitles: candidateSeed.targetJobTitles,
      preferredLocations: candidateSeed.preferredLocations,
      preferredWorkplaceTypes: candidateSeed.preferredWorkplaceTypes,
      preferredEmploymentTypes: candidateSeed.preferredEmploymentTypes,
      resumeUrl: candidateSeed.resumeUrl,
      resumePublicId: candidateSeed.resumeUrl
        ? `hireflow/demo/resumes/${candidateSeed.key}`
        : null,
      linkedinUrl: candidateSeed.linkedinUrl,
      githubUrl: candidateSeed.githubUrl,
      portfolioUrl: candidateSeed.portfolioUrl,
    });

    candidateMap.set(candidateSeed.key, candidate);
  }
};

const createJobs = async ({ userMap, companyMap, jobMap }) => {
  for (const jobSeed of jobSeeds) {
    const job = await Job.create({
      companyId: companyMap.get(jobSeed.companyKey)._id,
      createdBy: userMap.get(jobSeed.createdByKey)._id,
      title: jobSeed.title,
      description: jobSeed.description,
      responsibilities: jobSeed.responsibilities,
      requirements: jobSeed.requirements,
      skills: jobSeed.skills,
      location: jobSeed.location,
      employmentType: jobSeed.employmentType,
      workplaceType: jobSeed.workplaceType,
      experienceLevel: jobSeed.experienceLevel,
      salaryMin: jobSeed.salaryMin,
      salaryMax: jobSeed.salaryMax,
      salaryCurrency: "INR",
      isSalaryVisible: jobSeed.isSalaryVisible,
      status: jobSeed.status,
      closedAt: jobSeed.closedAt || null,
      createdAt: daysAgo(Math.floor(Math.random() * 40) + 2),
    });

    jobMap.set(jobSeed.key, job);
  }
};

const createApplications = async ({ candidateMap, jobMap }) => {
  let createdApplicationsCount = 0;

  for (const applicationSeed of applicationSeeds) {
    const job = jobMap.get(applicationSeed.jobKey);
    const candidate = candidateMap.get(applicationSeed.candidateKey);

    if (!job || !candidate) {
      throw new Error(
        `Invalid application seed: ${applicationSeed.jobKey} / ${applicationSeed.candidateKey}`,
      );
    }

    if (!candidate.resumeUrl) {
      throw new Error(
        `Candidate ${applicationSeed.candidateKey} has no resumeUrl and cannot be seeded with an application.`,
      );
    }

    const reviewerId = job.createdBy;
    const appliedAt = daysAgo(applicationSeed.appliedDaysAgo);

    const matchSnapshot = calculateJobCandidateMatch(
      job.toObject(),
      candidate.toObject(),
      {
        calculatedAt: appliedAt,
      },
    );

    await Application.create({
      jobId: job._id,
      candidateId: candidate._id,
      candidateUserId: candidate.userId,
      companyId: job.companyId,
      coverLetter: applicationSeed.coverLetter,
      resumeUrl: candidate.resumeUrl,
      status: applicationSeed.status,
      statusHistory: buildStatusHistory({
        finalStatus: applicationSeed.status,
        reviewerId,
        appliedAt,
      }),
      reviewedBy:
        applicationSeed.status === APPLICATION_STATUS.APPLIED
          ? null
          : reviewerId,
      matchSnapshot,
      appliedAt,
      createdAt: appliedAt,
      updatedAt: addDays(appliedAt, 1),
    });

    createdApplicationsCount += 1;
  }

  return createdApplicationsCount;
};

const seedDemoData = async () => {
  ensureSafeEnvironment();

  await connectDB();

  if (RESET_FLAG) {
    await resetDemoData();
  } else {
    await ensureDemoDataDoesNotExist();
  }

  const userMap = new Map();
  const companyMap = new Map();
  const recruiterMap = new Map();
  const candidateMap = new Map();
  const jobMap = new Map();

  await createUsers(userMap);
  await createCompanies({ userMap, companyMap });
  await createRecruiters({ userMap, companyMap, recruiterMap });
  await createCandidates({ userMap, candidateMap });
  await createJobs({ userMap, companyMap, jobMap });

  const applicationCount = await createApplications({
  candidateMap,
  jobMap,
});

  printSeedSummary({
    users: userMap.size,
    companies: companyMap.size,
    recruiters: recruiterMap.size,
    candidates: candidateMap.size,
    jobs: jobMap.size,
    applications: applicationCount,
  });
};

seedDemoData()
  .catch((error) => {
    console.error("\nDemo seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
