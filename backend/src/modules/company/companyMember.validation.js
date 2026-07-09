import { z } from "zod";

const optionalNullableString = (maxLength, message) => {
  return z
    .union([z.string().trim().max(maxLength, message), z.literal(""), z.null()])
    .optional()
    .transform((value) => value || null);
};

const updateCompanyMemberProfileSchema = z.object({
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

  phone: optionalNullableString(20, "Phone cannot exceed 20 characters"),

  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must contain at least 2 characters")
    .max(100, "Job title cannot exceed 100 characters"),
});

export { updateCompanyMemberProfileSchema };
