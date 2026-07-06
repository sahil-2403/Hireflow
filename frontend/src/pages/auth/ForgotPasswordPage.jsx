import { useState } from "react";

import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPassword } from "../../api/auth.api";

import { emailSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

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

const ForgotPasswordPage = () => {
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
      const result = await forgotPassword(formData.email);

      setSuccessMessage(result.message);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Account recovery
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            Reset your password securely.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Enter your registered email address and HireFlow will send you a
            password reset link.
          </p>

          <div className="mt-8 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-950">
              Security reminder
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use a strong password and never share your reset link with anyone.
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Account recovery
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Forgot your password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your email and we will send a password reset link.
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

            {successMessage && (
              <div
                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
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

              <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Remembered your password?{" "}
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

export default ForgotPasswordPage;
