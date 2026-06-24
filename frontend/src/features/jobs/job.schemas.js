import { z } from "zod";

const optionalSalaryValue = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return Number(value);
  },
  z
    .number({
      message: "Salary must be a number",
    })
    .nonnegative("Salary must be a positive number")
    .nullable(),
);

const createJobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Job title must contain at least 3 characters")
      .max(150, "Job title cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .min(20, "Description must contain at least 20 characters")
      .max(10000, "Description cannot exceed 10000 characters"),

    responsibilitiesText: z.string().trim().optional(),

    requirementsText: z.string().trim().optional(),

    skillsText: z.string().trim().optional(),

    location: z
      .string()
      .trim()
      .min(2, "Location is required")
      .max(200, "Location cannot exceed 200 characters"),

    employmentType: z.enum(
      ["full-time", "part-time", "contract", "internship"],
      {
        message: "Select an employment type",
      },
    ),

    workplaceType: z.enum(["onsite", "remote", "hybrid"], {
      message: "Select a workplace type",
    }),

    experienceLevel: z.enum(["entry", "mid", "senior", "lead"], {
      message: "Select an experience level",
    }),

    salaryMin: optionalSalaryValue,
    salaryMax: optionalSalaryValue,

    salaryCurrency: z
      .string()
      .trim()
      .length(3, "Currency must contain exactly 3 characters")
      .transform((value) => value.toUpperCase()),

    isSalaryVisible: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.salaryMin === null || data.salaryMax === null) {
        return true;
      }

      return data.salaryMax >= data.salaryMin;
    },
    {
      path: ["salaryMax"],
      message: "Maximum salary must be greater than or equal to minimum salary",
    },
  );

export { createJobSchema };
