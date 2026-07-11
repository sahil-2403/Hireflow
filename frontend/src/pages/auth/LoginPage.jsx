import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { login } from "../../api/auth.api";

import { loginSchema } from "../../features/auth/auth.schemas";
import { ROLES } from "../../features/auth/auth.constants";

import getApiError from "../../utils/getApiError";

import useAuth from "../../hooks/useAuth";

import PasswordField from "../../components/common/PasswordField";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import TextInput from "../../components/ui/TextInput";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const navigationMessage = location.state?.message || "";

  const [successMessage, setSuccessMessage] = useState(navigationMessage);

  const { signIn } = useAuth();

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
    if (!navigationMessage) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, navigationMessage, navigate]);

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

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

      setApiError(normalizedError.message);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] rounded-2xl bg-linear-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="hidden lg:block opacity-80">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Welcome back
          </p>

          <h1 className="mt-3 max-w-2xl text-5xl font-black tracking-tight text-slate-950">
            Continue your hiring or job search journey.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Access your candidate dashboard, manage applications, review jobs,
            or continue hiring from your company workspace.
          </p>
        </div>

        <Card className="w-full">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Login
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Login to HireFlow
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access your candidate, recruiter, or company dashboard.
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

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
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

              <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Register
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-slate-600">
              Didn&apos;t receive the verification email?{" "}
              <Link
                to="/resend-verification"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Resend it
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </main>
  );
};

export default LoginPage;
