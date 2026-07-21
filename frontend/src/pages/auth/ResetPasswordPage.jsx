import { useState } from "react";

import { KeyRound, Link2Off, LoaderCircle } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword } from "../../api/auth.api";

import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthResultState from "../../components/auth/AuthResultState";
import AuthSupportVisualPanel from "../../components/auth/AuthSupportVisualPanel";

import PasswordField from "../../components/common/PasswordField";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import { resetPasswordSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

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
    <AuthPageShell
      variant="recovery"
      scene={<AuthSupportVisualPanel variant="recovery" />}
      formClassName="max-w-md"
    >
      {!token ? (
        <AuthResultState
          icon={Link2Off}
          tone="error"
          title="Reset link is invalid"
          description="The password-reset token is missing. Request a new reset link to continue."
          actions={
            <>
              <Button as={Link} to="/forgot-password" fullWidth>
                Request a new link
              </Button>

              <Button as={Link} to="/login" variant="secondary" fullWidth>
                Return to sign in
              </Button>
            </>
          }
        />
      ) : (
        <>
          <header>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>

            <h2 className="mt-4 text-2xl font-semibold leading-8 tracking-tight text-slate-950">
              Create a new password
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Choose a strong new password for your HireFlow account.
            </p>
          </header>

          {apiError && (
            <Alert variant="error" className="mt-5">
              {apiError}
            </Alert>
          )}

          <form
            className="mt-6 grid gap-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <PasswordField
              id="password"
              label="New password"
              hint="At least 8 characters with uppercase, lowercase, and a number."
              placeholder="Enter a new password"
              autoComplete="new-password"
              registration={register("password")}
              error={errors.password?.message}
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              placeholder="Repeat the new password"
              autoComplete="new-password"
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
              {isSubmitting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {isSubmitting ? "Resetting password..." : "Reset password"}
            </Button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm leading-6 text-slate-600">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Return to sign in
            </Link>
          </p>
        </>
      )}
    </AuthPageShell>
  );
};

export default ResetPasswordPage;
