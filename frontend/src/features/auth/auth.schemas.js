import { z } from "zod";

import { ROLES } from "./auth.constants";

const PUBLIC_REGISTRATION_ROLES = [ROLES.CANDIDATE, ROLES.OWNER];

const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    role: z
      .enum(PUBLIC_REGISTRATION_ROLES, {
        message:
          "Select whether you are registering as a candidate or company owner",
      })
      .default(ROLES.CANDIDATE),

    username: z
      .string()
      .trim()
      .min(3, "Username must contain at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain only letters, numbers, and underscores",
      )
      .transform((value) => value.toLowerCase()),

    email: z.email("Enter a valid email address").trim().toLowerCase(),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/\d/, "Password must contain a number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const emailSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/\d/, "Password must contain a number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export { loginSchema, registerSchema, emailSchema, resetPasswordSchema };
