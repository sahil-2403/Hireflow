import { z } from "zod";

import { COMPANY_SIZE } from "../../config/constants.js";

const optionalUrl = z
  .union([z.string().trim().url("Invalid URL"), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must contain at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),

  logoUrl: optionalUrl,

  industry: z.string().trim().min(2, "Industry is required").max(100),

  companySize: z.enum(Object.values(COMPANY_SIZE)),

  websiteUrl: optionalUrl,

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional()
    .transform((value) => value || null),

  headquarters: z.string().trim().min(2, "Headquarters is required").max(200),
});

export const updateCompanySchema = createCompanySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one company field must be provided",
  });

export const createRecruiterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores",
    )
    .transform((value) => value.toLowerCase()),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain uppercase, lowercase and a number",
    ),

  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  jobTitle: z.string().trim().min(2).max(100),
});

export const updateRecruiterStatusSchema = z.object({
  isActive: z.boolean(),
});
