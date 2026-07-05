import { useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword } from "../../api/auth.api";

import { resetPasswordSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import PasswordField from "../../components/common/PasswordField";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";

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
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Password recovery
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            Create a new secure password.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Choose a strong password so your HireFlow account remains protected.
          </p>

          <div className="mt-8 grid max-w-xl gap-4">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Use at least 8 characters
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Add uppercase, lowercase, and number
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                Avoid using old passwords
              </p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Password recovery
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Create a new password
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose a strong password for your account.
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

            {!token && (
              <div
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                Password reset token is missing.
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

              <Button
                type="submit"
                disabled={isSubmitting || !token}
                fullWidth
                size="lg"
              >
                {isSubmitting ? "Resetting password..." : "Reset password"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Return to login
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
