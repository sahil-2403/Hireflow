import { useEffect, useState, useRef } from "react";

import { LoaderCircle, LogIn } from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { login } from "../../api/auth.api";

import PasswordField from "../../components/common/PasswordField";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import TextInput from "../../components/ui/TextInput";

import { ROLES } from "../../features/auth/auth.constants";

import { loginSchema } from "../../features/auth/auth.schemas";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

const LoginPage = () => {
  const location = useLocation();

  const navigate = useNavigate();

  const { signIn } = useAuth();

  const [apiError, setApiError] = useState("");

  const navigationMessage = location.state?.message || "";

  const hasShownNavigationMessageRef = useRef(false);

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
    if (!navigationMessage || hasShownNavigationMessageRef.current) {
      return;
    }

    hasShownNavigationMessageRef.current = true;

    notify.success(navigationMessage);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, navigationMessage, navigate]);

  const onSubmit = async (formData) => {
    setApiError("");

    try {
      const result = await login(formData);

      signIn(result.data.user);

      const role = result.data.user.role;

      if (role === ROLES.CANDIDATE) {
        navigate("/candidate/dashboard", {
          replace: true,
        });

        return;
      }

      if (role === ROLES.RECRUITER || role === ROLES.OWNER) {
        navigate("/company/dashboard", {
          replace: true,
        });

        return;
      }

      setApiError("Your account role is not supported.");
    } catch (error) {
      const normalizedError = getApiError(error);

      /*
       * Invalid credentials and account
       * verification problems remain inline
       * because they directly affect this form.
       */
      setApiError(normalizedError.message);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md py-2 sm:py-6">
      <Card>
        <CardBody className="p-4 sm:p-6">
          <header>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <LogIn className="h-5 w-5" aria-hidden="true" />
            </div>

            <h1 className="mt-4 text-2xl font-semibold leading-8 tracking-tight text-slate-950">
              Welcome back
            </h1>

            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Sign in to continue to your HireFlow workspace.
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

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-5 text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className={[
                    "text-sm font-medium",
                    "text-blue-600",
                    "transition-colors",

                    "hover:text-blue-700",
                    "hover:underline",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",
                    "focus-visible:ring-offset-2",
                  ].join(" ")}
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

            <Button
              type="submit"
              disabled={isSubmitting}
              fullWidth
              size="lg"
              className="mt-1"
            >
              {isSubmitting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm leading-6 text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className={[
                  "font-medium",
                  "text-blue-600",

                  "hover:text-blue-700",
                  "hover:underline",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-blue-500",
                  "focus-visible:ring-offset-2",
                ].join(" ")}
              >
                Create account
              </Link>
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verification email missing?{" "}
              <Link
                to="/resend-verification"
                className={[
                  "font-medium",
                  "text-blue-600",

                  "hover:text-blue-700",
                  "hover:underline",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-blue-500",
                  "focus-visible:ring-offset-2",
                ].join(" ")}
              >
                Resend email
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </section>
  );
};

export default LoginPage;
