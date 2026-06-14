import { z } from "zod";

import {
  JOB_STATUS,
  EMPLOYMENT_TYPE,
  WORKPLACE_TYPE,
  EXPERIENCE_LEVEL,
} from "../../config/constants.js";

const stringListSchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((values) => [...new Set(values)]);

const nullableSalarySchema = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const jobFields = {
  title: z
    .string()
    .trim()
    .min(3, "Job title must contain at least 3 characters")
    .max(150),

  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters")
    .max(10000),

  responsibilities: stringListSchema,
  requirements: stringListSchema,
  skills: stringListSchema,

  location: z.string().trim().min(2, "Location is required").max(200),

  employmentType: z.enum(Object.values(EMPLOYMENT_TYPE)),
  workplaceType: z.enum(Object.values(WORKPLACE_TYPE)),
  experienceLevel: z.enum(Object.values(EXPERIENCE_LEVEL)),

  salaryMin: nullableSalarySchema,
  salaryMax: nullableSalarySchema,

  salaryCurrency: z
    .string()
    .trim()
    .length(3, "Currency must contain exactly 3 characters")
    .transform((value) => value.toUpperCase())
    .optional()
    .default("INR"),

  isSalaryVisible: z.boolean().optional().default(true),
};

const validateSalaryRange = (data, context) => {
  if (
    data.salaryMin !== null &&
    data.salaryMin !== undefined &&
    data.salaryMax !== null &&
    data.salaryMax !== undefined &&
    data.salaryMin > data.salaryMax
  ) {
    context.addIssue({
      code: "custom",
      path: ["salaryMax"],
      message: "Maximum salary must be greater than or equal to minimum salary",
    });
  }
};

export const createJobSchema = z
  .object(jobFields)
  .superRefine(validateSalaryRange);

export const updateJobSchema = z
  .object(jobFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one job field must be provided",
  })
  .superRefine(validateSalaryRange);

export const updateJobStatusSchema = z.object({
  status: z.enum([JOB_STATUS.OPEN, JOB_STATUS.CLOSED]),
});
