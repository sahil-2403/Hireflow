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

const companyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must contain at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),

  industry: z
    .string()
    .trim()
    .min(2, "Industry is required")
    .max(100, "Industry cannot exceed 100 characters"),

  companySize: z.enum(
    ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    {
      message: "Select company size",
    },
  ),

  websiteUrl: optionalUrl,

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),

  headquarters: z
    .string()
    .trim()
    .min(2, "Headquarters is required")
    .max(200, "Headquarters cannot exceed 200 characters"),
});

export { companyProfileSchema };
