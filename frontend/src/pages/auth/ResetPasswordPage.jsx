import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword } from "../../api/auth.api";

import { resetPasswordSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import PasswordField from "../../components/common/PasswordField";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),

    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formData) => {
    setApiError("");

    const passwordData = {
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const result = await resetPassword(token, passwordData);

      navigate("/login", {
        replace: true,
        state: {
          message: result.message,
        },
      });
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
            Password recovery
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Create a new password
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose a strong password for your account.
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
          <PasswordField
            id="password"
            label="New password"
            placeholder="Enter a new password"
            autoComplete="new-password"
            registration={register("password")}
            error={errors.password?.message}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            placeholder="Enter the password again"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "Resetting password..." : "Reset password"}
          </button>
        </form>

        {!token && (
          <p className="mt-4 text-sm text-red-600">
            Password reset token is missing.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Return to login
          </Link>
        </p>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
