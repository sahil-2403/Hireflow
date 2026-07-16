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

export { buildAiSystemInstruction, buildJsonOnlyInstruction, buildJsonPrompt };
