import { useMemo } from "react";

import { Building2, LoaderCircle, UserRound } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "../../api/auth.api";

import PasswordField from "../../components/common/PasswordField";

import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";

import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthVisualPanel from "../../components/auth/AuthVisualPanel";

import { ROLES } from "../../features/auth/auth.constants";

import { registerSchema } from "../../features/auth/auth.schemas";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

const REGISTRATION_OPTIONS = [
  {
    role: ROLES.CANDIDATE,
    title: "Candidate",
    submitLabel: "Create candidate account",
    loadingLabel: "Creating account...",
    icon: UserRound,
  },
  {
    role: ROLES.OWNER,
    title: "Company admin",
    submitLabel: "Create company admin account",
    loadingLabel: "Creating account...",
    icon: Building2,
  },
];

const getRoleButtonClassName = (isSelected) => {
  return [
    "flex min-h-11",
    "w-full min-w-0",
    "items-start gap-3",
    "rounded-xl border",
    "p-3 text-left",
    "transition-colors",

    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-blue-500",
    "focus-visible:ring-offset-2",

    isSelected
      ? ["border-blue-300", "bg-blue-50/70"].join(" ")
      : [
          "border-slate-200",
          "bg-white",
          "hover:border-slate-300",
          "hover:bg-slate-50",
        ].join(" "),
  ].join(" ");
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      role: ROLES.CANDIDATE,
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  const selectedOption = useMemo(() => {
    return (
      REGISTRATION_OPTIONS.find((option) => option.role === selectedRole) ||
      REGISTRATION_OPTIONS[0]
    );
  }, [selectedRole]);

  const handleRoleSelect = (role) => {
    setValue("role", role, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const applyBackendFieldErrors = (backendErrors = []) => {
    let appliedErrorCount = 0;

    backendErrors.forEach((backendError) => {
      const fieldName = backendError.field;

      const supportedFields = [
        "role",
        "username",
        "email",
        "password",
        "confirmPassword",
      ];

      if (supportedFields.includes(fieldName)) {
        setError(fieldName, {
          type: "server",
          message: backendError.message,
        });

        appliedErrorCount += 1;
      }
    });

    return appliedErrorCount;
  };

  const onSubmit = async (formData) => {
    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    try {
      const result = await registerUser(registrationData);

      navigate("/login", {
        replace: true,

        state: {
          message: result.message,
        },
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      const appliedErrorCount = applyBackendFieldErrors(normalizedError.errors);

      if (appliedErrorCount === 0) {
        notify.error("Could not create account", {
          description: normalizedError.message,
        });
      }
    }
  };

  return (
    <AuthPageShell
      variant={selectedRole === ROLES.OWNER ? "company" : "candidate"}
      scene={
        <AuthVisualPanel
          variant={selectedRole === ROLES.OWNER ? "company" : "candidate"}
        />
      }
      formClassName="max-w-2xl"
    >
      <header>
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-slate-950">
          {selectedRole === ROLES.OWNER
            ? "Create your company-admin account"
            : "Create your candidate account"}
        </h2>

        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          {selectedRole === ROLES.OWNER
            ? "Set up your account before creating your company workspace."
            : "Create your account and begin building your candidate profile."}
        </p>
      </header>

      <form
        className="mt-6 grid gap-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <input type="hidden" {...register("role")} />

        <fieldset>
          <legend className="text-sm font-medium leading-5 text-slate-700">
            Account type
          </legend>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {REGISTRATION_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.role;

              const RoleIcon = option.icon;

              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => handleRoleSelect(option.role)}
                  aria-pressed={isSelected}
                  className={getRoleButtonClassName(isSelected)}
                >
                  <span
                    className={[
                      "grid h-6 w-6",
                      "shrink-0",
                      "place-items-center",
                      "rounded-lg",

                      isSelected
                        ? ["bg-blue-100", "text-blue-700"].join(" ")
                        : ["bg-slate-100", "text-slate-600"].join(" "),
                    ].join(" ")}
                  >
                    <RoleIcon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 ">
                    <span className="block text-sm font-semibold leading-5 text-slate-950">
                      {option.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {errors.role?.message && (
            <p
              role="alert"
              className="mt-2 text-xs font-medium leading-4.5 text-red-600"
            >
              {errors.role.message}
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            id="username"
            type="text"
            label="Username"
            autoComplete="username"
            placeholder="Choose a username"
            error={errors.username?.message}
            {...register("username")}
          />

          <TextInput
            id="email"
            type="email"
            label="Email address"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            id="password"
            label="Password"
            hint="At least 8 characters with uppercase, lowercase, and a number."
            placeholder="Create a password"
            autoComplete="new-password"
            registration={register("password")}
            error={errors.password?.message}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
          {isSubmitting && (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}

          {isSubmitting
            ? selectedOption.loadingLabel
            : selectedOption.submitLabel}
        </Button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm leading-6 text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
};

export default RegisterPage;
