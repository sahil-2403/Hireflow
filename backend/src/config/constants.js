export const ROLES = Object.freeze({
  OWNER: "owner",
  RECRUITER: "recruiter",
  CANDIDATE: "candidate",
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
