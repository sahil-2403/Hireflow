import { z } from "zod";

import { ROLES } from "../../config/constants.js";

const PUBLIC_REGISTRATION_ROLES = [ROLES.CANDIDATE, ROLES.OWNER];

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers and underscores",
  )
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    "Password must contain uppercase, lowercase and a number",
  );

const publicRegistrationRoleSchema = z
  .enum(PUBLIC_REGISTRATION_ROLES, {
    message: "Registration role must be either candidate or owner",
  })
  .default(ROLES.CANDIDATE);

const googleCredentialSchema = z
  .string()
  .trim()
  .min(1, "Google credential is required");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: publicRegistrationRoleSchema,
});

export const googleRegisterSchema = z.object({
  credential: googleCredentialSchema,
  role: publicRegistrationRoleSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  credential: googleCredentialSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
