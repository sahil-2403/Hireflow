export const ROLES = Object.freeze({
  OWNER: "owner",
  RECRUITER: "recruiter",
  CANDIDATE: "candidate",
});

export const AUTH_PROVIDERS = Object.freeze({
  LOCAL: "local",
  GOOGLE: "google",
});

export const APPLICATION_STATUS = Object.freeze({
  APPLIED: "applied",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  HIRED: "hired",
  REJECTED: "rejected",
});

export const JOB_STATUS = Object.freeze({
  OPEN: "open",
  CLOSED: "closed",
});

export const EMPLOYMENT_TYPE = Object.freeze({
  FULL_TIME: "full-time",
  PART_TIME: "part-time",
  CONTRACT: "contract",
  INTERNSHIP: "internship",
});

export const WORKPLACE_TYPE = Object.freeze({
  ONSITE: "onsite",
  REMOTE: "remote",
  HYBRID: "hybrid",
});

export const EXPERIENCE_LEVEL = Object.freeze({
  ENTRY: "entry",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
});

export const COMPANY_SIZE = Object.freeze({
  ONE_TO_TEN: "1-10",
  ELEVEN_TO_FIFTY: "11-50",
  FIFTY_ONE_TO_TWO_HUNDRED: "51-200",
  TWO_HUNDRED_ONE_TO_FIVE_HUNDRED: "201-500",
  FIVE_HUNDRED_ONE_TO_THOUSAND: "501-1000",
  ABOVE_THOUSAND: "1000+",
});

export const AI_FEATURE_KEYS = Object.freeze({
  RESUME_ANALYSIS: "resume_analysis",
  JOB_RESUME_FIT: "job_resume_fit",
  COMPANY_RESUME_REVIEW: "company_resume_review",
  JOB_POST_SUGGESTION: "job_post_suggestion",
  INTERVIEW_KIT: "interview_kit",
  SHORTLIST: "shortlist",
  CANDIDATE_COMPARISON: "candidate_comparison",
});

export const AI_FEATURE_LABELS = Object.freeze({
  [AI_FEATURE_KEYS.RESUME_ANALYSIS]: "AI Resume Insights",
  [AI_FEATURE_KEYS.JOB_RESUME_FIT]: "AI Resume Fit",
  [AI_FEATURE_KEYS.COMPANY_RESUME_REVIEW]: "AI Resume Match Review",
  [AI_FEATURE_KEYS.JOB_POST_SUGGESTION]: "AI Job Post Assistant",
  [AI_FEATURE_KEYS.INTERVIEW_KIT]: "AI Interview Kit",
  [AI_FEATURE_KEYS.SHORTLIST]: "AI Suggested Shortlist",
  [AI_FEATURE_KEYS.CANDIDATE_COMPARISON]: "AI Candidate Comparison",
});

export const RESUME_ANALYSIS_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
});

export const RESUME_ANALYSIS_SOURCE_TYPES = Object.freeze({
  CANDIDATE_PROFILE_RESUME: "candidate_profile_resume",
  APPLICATION_RESUME: "application_resume",
});
