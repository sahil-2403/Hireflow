import { z } from "zod";

import {
  EMPLOYMENT_TYPE,
  EXPERIENCE_LEVEL,
  WORKPLACE_TYPE,
} from "../../config/constants.js";

const optionalText = (maximum) =>
  z
    .union([z.string().trim().max(maximum), z.literal(""), z.null()])
    .optional()
    .transform((value) => value || null);

const optionalUrl = z
  .union([z.string().trim().url("Invalid URL"), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

const skillsSchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((values) => [
    ...new Set(values.map((value) => value.toLowerCase())),
  ]);

const optionalTextArray = (maximumItems, maximumLength = 100) =>
  z
    .array(z.string().trim().min(1).max(maximumLength))
    .max(maximumItems)
    .default([])
    .transform((values) => [
      ...new Set(values.map((value) => value.toLowerCase())),
    ]);

const optionalEnumArray = (allowedValues, maximumItems) =>
  z
    .array(z.enum(allowedValues))
    .max(maximumItems)
    .default([])
    .transform((values) => [...new Set(values)]);

const candidateFields = {
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),

  phone: optionalText(20),
  headline: optionalText(150),
  summary: optionalText(2000),

  skills: skillsSchema,

  experienceLevel: z.enum(Object.values(EXPERIENCE_LEVEL)),

  location: z.string().trim().min(2, "Location is required").max(200),

  targetJobTitles: optionalTextArray(10, 100),

  preferredLocations: optionalTextArray(10, 100),

  preferredWorkplaceTypes: optionalEnumArray(
    Object.values(WORKPLACE_TYPE),
    Object.values(WORKPLACE_TYPE).length,
  ),

  preferredEmploymentTypes: optionalEnumArray(
    Object.values(EMPLOYMENT_TYPE),
    Object.values(EMPLOYMENT_TYPE).length,
  ),

  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
};

export const createCandidateProfileSchema = z.object(candidateFields);

export const updateCandidateProfileSchema = z
  .object(candidateFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field must be provided",
  });
