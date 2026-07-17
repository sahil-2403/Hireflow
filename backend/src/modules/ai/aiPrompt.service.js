const HIRING_SAFETY_RULES = [
  "Do not make final hiring decisions.",
  "Do not recommend rejecting or hiring a candidate.",
  "Do not evaluate protected personal attributes.",
  "Focus only on job-related skills, projects, experience, resume clarity, and role requirements.",
  "Clearly separate evidence, gaps, and suggestions.",
];

const buildAiSystemInstruction = (purpose) => {
  return [
    "You are HireFlow's AI assistant for job matching and hiring workflow support.",
    `Purpose: ${purpose}`,
    ...HIRING_SAFETY_RULES,
    "Return helpful, concise, structured output.",
  ].join("\n");
};

const buildJsonOnlyInstruction = () => {
  return [
    "Return only valid JSON.",
    "Do not include markdown.",
    "Do not include code fences.",
    "Do not include explanations outside the JSON object.",
  ].join("\n");
};

const buildJsonPrompt = ({ task, context, outputShape }) => {
  return [
    `Task: ${task}`,
    "",
    "Context:",
    JSON.stringify(context, null, 2),
    "",
    "Required JSON output shape:",
    JSON.stringify(outputShape, null, 2),
    "",
    buildJsonOnlyInstruction(),
  ].join("\n");
};

const buildInterviewKitPrompt = ({
  job,
  candidateProfile,
  resumeAnalysis,
  match,
  resumeReview = null,
}) => {
  return buildJsonPrompt({
    task: [
      "Generate an interview kit for this candidate and job.",
      "Questions must verify job-related skills, project depth, resume evidence, and weak areas.",
      "Use the deterministic match and resume review only as guidance.",
      "Do not recommend hiring or rejecting the candidate.",
      "Keep questions practical and suitable for a recruiter or interviewer.",
    ].join(" "),

    context: {
      job: {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        location: job.location,
        employmentType: job.employmentType,
        workplaceType: job.workplaceType,
        experienceLevel: job.experienceLevel,
      },

      candidateProfile: {
        headline: candidateProfile.headline,
        summary: candidateProfile.summary,
        skills: candidateProfile.skills,
        experienceLevel: candidateProfile.experienceLevel,
        location: candidateProfile.location,
        targetJobTitles: candidateProfile.targetJobTitles,
      },

      resumeAnalysis: {
        extracted: resumeAnalysis.extracted,
        evaluation: resumeAnalysis.evaluation,
      },

      deterministicMatch: {
        matchScore: match.matchScore,
        matchLabel: match.matchLabel,
        matchBasis: match.matchBasis,
        profileScore: match.profileScore,
        resumeBoost: match.resumeBoost,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        resumeEvidence: match.resumeEvidence,
      },

      resumeReview,
    },

    outputShape: INTERVIEW_KIT_OUTPUT_SHAPE,
  });
};

const buildJobPostAssistantPrompt = ({ company, jobDraft }) => {
  return buildJsonPrompt({
    task: [
      "Improve this job post draft so it is clear, professional, inclusive, and useful to suitable candidates.",
      "Preserve the company's actual requirements and facts.",
      "Do not invent salary, benefits, technologies, responsibilities, experience requirements, or company policies.",
      "Separate missing information from suggested rewritten content.",
      "Use concise language and avoid unnecessary buzzwords.",
      "Return suggestions only. The user will decide which suggestions to apply.",
    ].join(" "),

    context: {
      company: {
        name: company.name,
        industry: company.industry,
        companySize: company.companySize,
        description: company.description,
        headquarters: company.headquarters,
      },

      jobDraft: {
        title: jobDraft.title,
        description: jobDraft.description,
        responsibilities: jobDraft.responsibilities,
        requirements: jobDraft.requirements,
        skills: jobDraft.skills,
        location: jobDraft.location,
        employmentType: jobDraft.employmentType,
        workplaceType: jobDraft.workplaceType,
        experienceLevel: jobDraft.experienceLevel,
        salaryMin: jobDraft.salaryMin,
        salaryMax: jobDraft.salaryMax,
        salaryCurrency: jobDraft.salaryCurrency,
        isSalaryVisible: jobDraft.isSalaryVisible,
      },
    },

    outputShape: JOB_POST_ASSISTANT_OUTPUT_SHAPE,
  });
};

const buildApplicationResumeReviewPrompt = ({
  job,
  candidateProfile,
  resumeAnalysis,
  match,
}) => {
  return buildJsonPrompt({
    task: [
      "Review the candidate's submitted resume against this job.",
      "Use the deterministic match score as the scoring source of truth.",
      "Explain job-related evidence found in the resume.",
      "Identify missing or weak areas that should be verified.",
      "Suggest interview focus areas.",
      "Do not recommend hiring, rejecting, or making a final decision.",
    ].join(" "),

    context: {
      job: {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        location: job.location,
        employmentType: job.employmentType,
        workplaceType: job.workplaceType,
        experienceLevel: job.experienceLevel,
      },

      candidateProfile: {
        headline: candidateProfile.headline,
        summary: candidateProfile.summary,
        skills: candidateProfile.skills,
        experienceLevel: candidateProfile.experienceLevel,
        location: candidateProfile.location,
        targetJobTitles: candidateProfile.targetJobTitles,
      },

      resumeAnalysis: {
        extracted: resumeAnalysis.extracted,
        evaluation: resumeAnalysis.evaluation,
      },

      deterministicMatch: {
        matchScore: match.matchScore,
        matchLabel: match.matchLabel,
        matchBasis: match.matchBasis,
        profileScore: match.profileScore,
        resumeBoost: match.resumeBoost,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        resumeEvidence: match.resumeEvidence,
      },
    },

    outputShape: APPLICATION_RESUME_REVIEW_OUTPUT_SHAPE,
  });
};

const buildJobResumeFitPrompt = ({
  candidateProfile,
  job,
  resumeAnalysis,
  match,
}) => {
  return buildJsonPrompt({
    task: [
      "Review how well the candidate's analyzed resume fits this specific job.",
      "Use the deterministic match score as the scoring source of truth.",
      "Do not invent experience that is not present in the resume analysis.",
      "Give practical resume and profile improvements before applying.",
      "Do not recommend hiring or rejecting the candidate.",
    ].join(" "),

    context: {
      job: {
        title: job.title,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        skills: job.skills,
        location: job.location,
        employmentType: job.employmentType,
        workplaceType: job.workplaceType,
        experienceLevel: job.experienceLevel,
      },

      candidateProfile: {
        headline: candidateProfile.headline,
        summary: candidateProfile.summary,
        skills: candidateProfile.skills,
        experienceLevel: candidateProfile.experienceLevel,
        location: candidateProfile.location,
        targetJobTitles: candidateProfile.targetJobTitles,
        preferredLocations: candidateProfile.preferredLocations,
        preferredWorkplaceTypes: candidateProfile.preferredWorkplaceTypes,
        preferredEmploymentTypes: candidateProfile.preferredEmploymentTypes,
      },

      resumeAnalysis: {
        extracted: resumeAnalysis.extracted,
        evaluation: resumeAnalysis.evaluation,
      },

      deterministicMatch: {
        matchScore: match.matchScore,
        matchLabel: match.matchLabel,
        matchBasis: match.matchBasis,
        profileScore: match.profileScore,
        resumeBoost: match.resumeBoost,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        resumeEvidence: match.resumeEvidence,
      },
    },

    outputShape: JOB_RESUME_FIT_OUTPUT_SHAPE,
  });
};

const buildResumeAnalysisPrompt = ({ candidateProfile }) => {
  return buildJsonPrompt({
    task: [
      "Analyze the attached candidate resume PDF.",
      "Extract structured resume information.",
      "Evaluate resume quality for job-search readiness.",
      "Suggest practical improvements for the candidate profile and resume.",
      "Only include evidence that is visible in the resume. If something is not clear, list it as missing or unclear.",
    ].join(" "),
    context: {
      candidateProfile: {
        headline: candidateProfile.headline,
        summary: candidateProfile.summary,
        skills: candidateProfile.skills,
        experienceLevel: candidateProfile.experienceLevel,
        location: candidateProfile.location,
        targetJobTitles: candidateProfile.targetJobTitles,
        preferredLocations: candidateProfile.preferredLocations,
        preferredWorkplaceTypes: candidateProfile.preferredWorkplaceTypes,
        preferredEmploymentTypes: candidateProfile.preferredEmploymentTypes,
        linkedinUrl: candidateProfile.linkedinUrl,
        githubUrl: candidateProfile.githubUrl,
        portfolioUrl: candidateProfile.portfolioUrl,
      },
    },
    outputShape: RESUME_ANALYSIS_OUTPUT_SHAPE,
  });
};

const RESUME_ANALYSIS_OUTPUT_SHAPE = {
  extracted: {
    fullName: null,
    email: null,
    phone: null,
    location: null,
    summary: null,
    targetRoles: [],
    skills: [],
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    projects: [
      {
        name: null,
        description: null,
        technologies: [],
        impact: null,
        links: [],
      },
    ],
    experience: [
      {
        title: null,
        company: null,
        duration: null,
        highlights: [],
      },
    ],
    education: [
      {
        degree: null,
        institution: null,
        year: null,
      },
    ],
    certifications: [],
    links: [],
  },
  evaluation: {
    resumeScore: 0,
    strengths: [],
    weaknesses: [],
    missingKeywords: [],
    atsIssues: [],
    improvementSuggestions: [],
    recommendedProfileUpdates: {
      headline: null,
      summary: null,
      skills: [],
      targetJobTitles: [],
    },
  },
};

const JOB_RESUME_FIT_OUTPUT_SHAPE = {
  summary: "",
  matchedRequirements: [],
  missingRequirements: [],
  resumeImprovements: [],
  profileImprovements: [],
  beforeApplyingChecklist: [],
};

const APPLICATION_RESUME_REVIEW_OUTPUT_SHAPE = {
  summary: "",
  matchedEvidence: [
    {
      requirement: "",
      evidence: "",
    },
  ],
  missingOrWeakAreas: [],
  resumeStrengths: [],
  interviewFocus: [],
  riskNotes: [],
};

const JOB_POST_ASSISTANT_OUTPUT_SHAPE = {
  improvedTitle: "",
  improvedDescription: "",
  improvedResponsibilities: [],
  improvedRequirements: [],
  recommendedSkills: [],
  qualityNotes: [],
  missingInformation: [],
};

const INTERVIEW_KIT_OUTPUT_SHAPE = {
  technicalQuestions: [
    {
      question: "",
      whyAsk: "",
    },
  ],
  projectQuestions: [
    {
      question: "",
      whyAsk: "",
    },
  ],
  skillGapQuestions: [
    {
      question: "",
      whyAsk: "",
    },
  ],
  behavioralQuestions: [
    {
      question: "",
      whyAsk: "",
    },
  ],
  evaluationChecklist: [],
};

export {
  buildAiSystemInstruction,
  buildJsonOnlyInstruction,
  buildJsonPrompt,
  buildResumeAnalysisPrompt,
  buildJobResumeFitPrompt,
  buildApplicationResumeReviewPrompt,
  buildJobPostAssistantPrompt,
  buildInterviewKitPrompt,
  INTERVIEW_KIT_OUTPUT_SHAPE,
  RESUME_ANALYSIS_OUTPUT_SHAPE,
  JOB_RESUME_FIT_OUTPUT_SHAPE,
  APPLICATION_RESUME_REVIEW_OUTPUT_SHAPE,
  JOB_POST_ASSISTANT_OUTPUT_SHAPE,
};
