import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || "")
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Enter a valid URL",
    },
  );

const candidateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  phone: z
    .string()
    .trim()
    .max(20, "Phone cannot exceed 20 characters")
    .optional(),

  headline: z
    .string()
    .trim()
    .max(150, "Headline cannot exceed 150 characters")
    .optional(),

  summary: z
    .string()
    .trim()
    .max(2000, "Summary cannot exceed 2000 characters")
    .optional(),

  skillsText: z.string().trim().optional(),

  experienceLevel: z.enum(["entry", "mid", "senior", "lead"], {
    message: "Select an experience level",
  }),

  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(200, "Location cannot exceed 200 characters"),

  targetJobTitlesText: z
    .string()
    .trim()
    .max(500, "Target job titles cannot exceed 500 characters")
    .optional(),

  preferredLocationsText: z
    .string()
    .trim()
    .max(500, "Preferred locations cannot exceed 500 characters")
    .optional(),

  preferredWorkplaceTypes: z
    .array(z.enum(["onsite", "remote", "hybrid"]))
    .optional()
    .default([]),

  preferredEmploymentTypes: z
    .array(z.enum(["full-time", "part-time", "contract", "internship"]))
    .optional()
    .default([]),

  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export { candidateProfileSchema };
