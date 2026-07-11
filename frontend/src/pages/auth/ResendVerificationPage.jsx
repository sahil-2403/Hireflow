import { useState } from "react";

import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resendVerificationEmail } from "../../api/auth.api";

import { emailSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import TextInput from "../../components/ui/TextInput";

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
    <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Email verification
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            Need a new verification link?
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Enter your registered email address and we will send another
            verification email.
          </p>

          <div className="mt-8 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-950">
              Check your inbox and spam folder
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verification emails can sometimes take a few minutes to arrive.
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Email verification
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Resend verification email
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your account email and we will send another verification
                link.
              </p>
            </div>

            {apiError && (
              <Alert variant="error" className="mb-6">
                {apiError}
              </Alert>
            )}

            {successMessage && (
              <Alert variant="success" className="mb-6">
                {successMessage}
              </Alert>
            )}

            <form
              className="space-y-5"
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
                {isSubmitting ? "Sending..." : "Send verification email"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already verified?{" "}
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

export default ResendVerificationPage;
