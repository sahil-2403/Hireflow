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

export {
  buildAiSystemInstruction,
  buildJsonOnlyInstruction,
  buildJsonPrompt,
  buildResumeAnalysisPrompt,
  RESUME_ANALYSIS_OUTPUT_SHAPE,
};
