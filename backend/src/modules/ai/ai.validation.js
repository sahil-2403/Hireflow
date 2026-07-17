import { z } from "zod";

import {
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  WORKPLACE_TYPE,
} from "../../config/constants.js";

const optionalStringListSchema = z
  .array(z.string().trim().min(1).max(500))
  .max(30)
  .optional()
  .transform((values) => [...new Set(values || [])]);

const optionalSalarySchema = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const jobPostSuggestionFields = {
  title: z.string().trim().min(2).max(150).optional(),

  description: z.string().trim().min(5).max(10000).optional(),

  responsibilities: optionalStringListSchema,

  requirements: optionalStringListSchema,

  skills: optionalStringListSchema,

  location: z.string().trim().min(2).max(200).optional(),

  employmentType: z.enum(Object.values(EMPLOYMENT_TYPE)).optional(),

  workplaceType: z.enum(Object.values(WORKPLACE_TYPE)).optional(),

  experienceLevel: z.enum(Object.values(EXPERIENCE_LEVEL)).optional(),

  salaryMin: optionalSalarySchema,

  salaryMax: optionalSalarySchema,

  salaryCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),

  isSalaryVisible: z.boolean().optional(),
};

const validateSalaryRange = (data, context) => {
  if (
    data.salaryMin !== null &&
    data.salaryMax !== null &&
    data.salaryMin > data.salaryMax
  ) {
    context.addIssue({
      code: "custom",
      path: ["salaryMax"],
      message: "Maximum salary must be greater than or equal to minimum salary",
    });
  }
};

const hasMeaningfulJobContent = (data) => {
  return Boolean(
    data.title ||
    data.description ||
    data.responsibilities.length > 0 ||
    data.requirements.length > 0 ||
    data.skills.length > 0,
  );
};

const jobPostSuggestionSchema = z
  .object(jobPostSuggestionFields)
  .refine(hasMeaningfulJobContent, {
    message:
      "Provide a title, description, responsibility, requirement, or skill",
  })
  .superRefine(validateSalaryRange);

const suggestedShortlistSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(5),
});

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid application ID");

const candidateComparisonSchema = z
  .object({
    applicationIds: z.array(objectIdSchema).min(2).max(50),
  })
  .transform((data) => ({
    ...data,
    applicationIds: [...new Set(data.applicationIds)],
  }))
  .refine((data) => data.applicationIds.length >= 2, {
    path: ["applicationIds"],
    message: "Select at least 2 different applications",
  });

export {
  jobPostSuggestionSchema,
  suggestedShortlistSchema,
  candidateComparisonSchema,
};
