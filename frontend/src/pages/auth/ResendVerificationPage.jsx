import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resendVerificationEmail } from "../../api/auth.api";

import { emailSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";

const ResendVerificationPage = () => {
  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailSchema),

    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

    try {
      const result = await resendVerificationEmail(formData.email);

      setSuccessMessage(result.message);
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
            Email verification
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Resend verification email
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your account email and we will send another verification link.
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Sending..." : "Send verification email"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already verified?{" "}
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

export default ResendVerificationPage;
