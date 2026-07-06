import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerCandidate } from "../../api/auth.api";

import { registerSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import PasswordField from "../../components/common/PasswordField";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";

const getInputClassName = (hasError) => {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-50"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
  ].join(" ");
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const applyBackendFieldErrors = (backendErrors = []) => {
    backendErrors.forEach((error) => {
      const fieldName = error.field;

      if (
        ["username", "email", "password", "confirmPassword"].includes(fieldName)
      ) {
        setError(fieldName, {
          type: "server",
          message: error.message,
        });
      }
    });
  };

  const onSubmit = async (formData) => {
    setApiError("");

    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    try {
      const result = await registerCandidate(registrationData);

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
    <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_520px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate registration
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            Create your profile and start applying smarter.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Register as a candidate, complete your profile, upload your resume,
            and track every application from one clean workspace.
          </p>

          <div className="mt-8 grid max-w-xl gap-4">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Build a recruiter-ready profile
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Add your skills, experience level, location, and portfolio
                links.
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Upload your resume
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep your resume ready before applying to jobs.
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Track applications
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Follow each application status from your candidate dashboard.
              </p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Register
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Create your HireFlow account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Register as a candidate and start applying to open
                opportunities.
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
                {isSubmitting ? "Creating account..." : "Create account"}
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
