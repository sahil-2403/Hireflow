import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerCandidate } from "../../api/auth.api";

import { registerSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";
import PasswordField from "../../components/common/PasswordField";

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

  const applyBackendFieldErrors = (backendErrors) => {
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

    const registrationData = ({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    } = formData);

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
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate registration
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Create your HireFlow account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Register as a candidate and start applying to open opportunities.
          </p>
        </div>

        {apiError && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Username"
              className={[
                "w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 outline-none transition",
                "placeholder:text-slate-400 focus:ring-2",
                errors.username
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100",
              ].join(" ")}
              {...register("username")}
            />

            <FieldError message={errors.username?.message} />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={[
                "w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 outline-none transition",
                "placeholder:text-slate-400 focus:ring-2",
                errors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100",
              ].join(" ")}
              {...register("email")}
            />

            <FieldError message={errors.email?.message} />
          </div>

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

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            Passwords must contain at least eight characters, one uppercase
            letter, one lowercase letter, and one number.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login
          </Link>
        </p>
      </section>
    </main>
  );
};

export default RegisterPage;
