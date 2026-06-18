import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { login } from "../../api/auth.api";
import { loginSchema } from "../../features/auth/auth.schemas";
import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";
import PasswordField from "../../components/common/PasswordField";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const navigationMessage = location.state?.message;

    if (!navigationMessage) {
      return;
    }

    setSuccessMessage(navigationMessage);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.state, navigate]);

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

    try {
      const result = await login(formData);

      setSuccessMessage(result.message);

      console.log("Login response:", result.data);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Welcome back
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Login to HireFlow
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access your candidate, recruiter, or company dashboard.
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

        {successMessage && (
          <div
            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
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

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <PasswordField
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              registration={register("password")}
              error={errors.password?.message}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have a candidate account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Register
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-slate-600">
          Didn&apos;t receive the verification email?{" "}
          <Link
            to="/resend-verification"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Resend it
          </Link>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
