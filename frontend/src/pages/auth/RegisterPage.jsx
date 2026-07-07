import { useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "../../api/auth.api";

import { ROLES } from "../../features/auth/auth.constants";
import { registerSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import PasswordField from "../../components/common/PasswordField";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";

const registrationOptions = [
  {
    role: ROLES.CANDIDATE,
    eyebrow: "Looking for a job?",
    title: "Register as a candidate",
    heroEyebrow: "Candidate registration",
    heroTitle: "Create your profile and start applying smarter.",
    heroDescription:
      "Register as a candidate, complete your profile, upload your resume, and track every application from one clean workspace.",
    formTitle: "Create your candidate account",
    formDescription:
      "Start applying to open opportunities and manage your job search from HireFlow.",
    submitLabel: "Create candidate account",
    loadingLabel: "Creating candidate account...",
    highlights: [
      {
        title: "Build a recruiter-ready profile",
        description:
          "Add your skills, experience level, location, and portfolio links.",
      },
      {
        title: "Upload your resume",
        description: "Keep your resume ready before applying to jobs.",
      },
      {
        title: "Track applications",
        description:
          "Follow each application status from your candidate dashboard.",
      },
    ],
  },
  {
    role: ROLES.OWNER,
    eyebrow: "Hiring for your company?",
    title: "Register as a company Admin",
    heroEyebrow: "Company Admin registration",
    heroTitle: "Create your hiring workspace for your company.",
    heroDescription:
      "Register as a company admin first. After email verification, you can create your company profile, post jobs, and invite recruiters.",
    formTitle: "Create your company admin account",
    formDescription:
      "After verifying your email, you can create your company profile and start managing hiring workflows.",
    submitLabel: "Create company Admin account",
    loadingLabel: "Creating admin account...",
    highlights: [
      {
        title: "Create your company profile",
        description:
          "Add company details that candidates will see on your job listings.",
      },
      {
        title: "Post jobs for your company",
        description:
          "Create and manage openings from a dedicated company dashboard.",
      },
      {
        title: "Invite recruiters",
        description: "Add recruiter accounts that belong only to your company.",
      },
    ],
  },
];

const getInputClassName = (hasError) => {
  return [
    "w-full rounded-xl border bg-white! px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-50"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
  ].join(" ");
};

const getRoleButtonClassName = (isSelected) => {
  return [
    "rounded-2xl border p-4 text-left transition w-full",
    isSelected
      ? "border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-100"
      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
  ].join(" ");
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      role: ROLES.CANDIDATE,
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  const selectedRegistrationOption = useMemo(() => {
    return (
      registrationOptions.find((option) => option.role === selectedRole) ||
      registrationOptions[0]
    );
  }, [selectedRole]);

  const applyBackendFieldErrors = (backendErrors = []) => {
    backendErrors.forEach((error) => {
      const fieldName = error.field;

      if (
        ["role", "username", "email", "password", "confirmPassword"].includes(
          fieldName,
        )
      ) {
        setError(fieldName, {
          type: "server",
          message: error.message,
        });
      }
    });
  };

  const handleRoleSelect = (role) => {
    setApiError("");

    setValue("role", role, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (formData) => {
    setApiError("");

    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    try {
      const result = await registerUser(registrationData);

      navigate("/login", {
        replace: true,
        state: {
          message: result.message,
        },
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      applyBackendFieldErrors(normalizedError.errors);

      setApiError(normalizedError.message);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] rounded-2xl bg-linear-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-8xl gap-8 lg:grid-cols-[1fr_540px] lg:items-start">
        <div className="hidden opacity-80 lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            {selectedRegistrationOption.heroEyebrow}
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            {selectedRegistrationOption.heroTitle}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            {selectedRegistrationOption.heroDescription}
          </p>

          <div className="mt-8 grid max-w-xl gap-4">
            {selectedRegistrationOption.highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-950">
                  {highlight.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Register
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {selectedRegistrationOption.formTitle}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedRegistrationOption.formDescription}
              </p>
            </div>

            {apiError && (
              <div
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {apiError}
              </div>
            )}

            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <input type="hidden" {...register("role")} />

              <div>
                <p className="mb-3 text-sm font-bold text-slate-800">
                  Choose your registration purpose
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {registrationOptions.map((option) => {
                    const isSelected = selectedRole === option.role;

                    return (
                      <div classname="flex">
                        <span className="text-[0.7rem] ml-1 font-bold uppercase tracking-wider text-blue-600">
                          {option.eyebrow}
                        </span>

                        <button
                          key={option.role}
                          type="button"
                          className={getRoleButtonClassName(isSelected)}
                          onClick={() => handleRoleSelect(option.role)}
                          aria-pressed={isSelected}
                        >
                          <span className=" block text-sm tracking-tight font-black text-slate-950">
                            {option.title}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {errors.role?.message && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <FormField
                label="Username"
                htmlFor="username"
                error={errors.username?.message}
              >
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Username"
                  className={getInputClassName(Boolean(errors.username))}
                  {...register("username")}
                />
              </FormField>

              <FormField
                label="Email address"
                htmlFor="email"
                error={errors.email?.message}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={getInputClassName(Boolean(errors.email))}
                  {...register("email")}
                />
              </FormField>

              <PasswordField
                id="password"
                label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                registration={register("password")}
                error={errors.password?.message}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                placeholder="Enter the password again"
                autoComplete="new-password"
                registration={register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                Passwords must contain at least eight characters, one uppercase
                letter, one lowercase letter, and one number.
              </div>

              <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                {isSubmitting
                  ? selectedRegistrationOption.loadingLabel
                  : selectedRegistrationOption.submitLabel}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </main>
  );
};

export default RegisterPage;
