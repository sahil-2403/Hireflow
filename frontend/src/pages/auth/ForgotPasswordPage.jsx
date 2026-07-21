import { useState } from "react";

import { KeyRound, LoaderCircle, MailCheck } from "lucide-react";

import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPassword } from "../../api/auth.api";

import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthResultState from "../../components/auth/AuthResultState";
import AuthSupportVisualPanel from "../../components/auth/AuthSupportVisualPanel";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";

import { emailSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [pageState, setPageState] = useState("form");

  const {
    register,
    handleSubmit,
    reset,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailSchema),

    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData) => {
    setApiError("");

    try {
      const result = await forgotPassword(formData.email);

      setSuccessMessage(
        result.message ||
          "Password reset instructions were sent to your email.",
      );

      setPageState("success");
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  const handleUseAnotherEmail = () => {
    setApiError("");
    setSuccessMessage("");
    setPageState("form");
    reset();
  };

  return (
    <AuthPageShell
      variant="recovery"
      scene={<AuthSupportVisualPanel variant="recovery" />}
      formClassName="max-w-md"
    >
      {pageState === "success" ? (
        <AuthResultState
          icon={MailCheck}
          tone="success"
          title="Check your email"
          description={successMessage}
          actions={
            <>
              <Button as={Link} to="/login" fullWidth>
                Return to sign in
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleUseAnotherEmail}
              >
                Use another email
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
              Forgot your password?
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Enter your registered email and we will send a password reset
              link.
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
            <TextInput
              id="email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
              {isSubmitting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {isSubmitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm leading-6 text-slate-600">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;
