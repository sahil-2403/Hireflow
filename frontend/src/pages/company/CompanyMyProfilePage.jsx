import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getMyCompanyMemberProfile,
  updateMyCompanyMemberProfile,
} from "../../api/companyMember.api";

import { companyMemberProfileSchema } from "../../features/companies/companyMember.schemas";

import getApiError from "../../utils/getApiError";
import getRoleDisplayName from "../../utils/getRoleDisplayName";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import useAuth from "../../hooks/useAuth";

import ProfileAvatar from "../../components/common/ProfileAvatar";
import ProfilePhotoManager from "../../components/account/ProfilePhotoManager";

import Button from "../../components/ui/Button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

const getDefaultValues = (profile = null) => {
  return {
    firstName: profile?.member?.firstName ?? "",
    lastName: profile?.member?.lastName ?? "",
    phone: profile?.member?.phone ?? "",
    jobTitle: profile?.member?.jobTitle ?? "",
  };
};

const convertFormDataToPayload = (formData) => {
  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone || null,
    jobTitle: formData.jobTitle,
  };
};

const getInputClassName = (hasError = false) => {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-50"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
  ].join(" ");
};

const getFullName = (values, user) => {
  const name = [values.firstName, values.lastName].filter(Boolean).join(" ");

  return name || user?.username || user?.email || "Your profile";
};

const ProfilePreviewCard = ({ values, user, profile }) => {
  const fullName = getFullName(values, user);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <ProfileAvatar user={user} name={fullName} size="lg" />

          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Preview
            </p>

            <h2 className="mt-2 truncate text-2xl font-black text-slate-950">
              {fullName}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-600">
              {values.jobTitle || "Add your job title"}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              {profile?.company?.name
                ? `${profile.company.name} workspace`
                : "Company workspace"}
            </p>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <Button as={Link} to="/company/dashboard" variant="secondary" fullWidth>
          Back to dashboard
        </Button>
      </CardFooter>
    </Card>
  );
};

const AccountInfoCard = ({ user, profile }) => {
  const rows = [
    {
      label: "Username",
      value: user?.username || "Unavailable",
    },
    {
      label: "Email",
      value: user?.email || "Unavailable",
    },
    {
      label: "Role",
      value: getRoleDisplayName(user?.role),
    },
    {
      label: "Company",
      value: profile?.company?.name || "Company profile required",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Account
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Account information
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          These details come from your login account and company workspace.
        </p>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {row.label}
              </p>

              <p className="mt-1 wrap-break-word text-sm font-bold text-slate-900">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const CompanyMyProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [pageStatus, setPageStatus] = useState("loading");
  const [mode, setMode] = useState("edit");
  const [profile, setProfile] = useState(null);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyMemberProfileSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = useWatch({ control }) ?? getDefaultValues();

  const fullName = useMemo(() => {
    return getFullName(watchedValues, user);
  }, [watchedValues, user]);

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      try {
        setPageStatus("loading");
        setApiError("");

        const result = await getMyCompanyMemberProfile();

        if (shouldIgnore) {
          return;
        }

        setProfile(result.data);
        setMode("edit");
        reset(getDefaultValues(result.data));
        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (isCompanyProfileMissingError(normalizedError)) {
          setProfile(null);
          setPageStatus("company-missing");
          setApiError(normalizedError.message);
          return;
        }

        if (
          normalizedError.statusCode === 404 &&
          normalizedError.message === "Company owner profile not found"
        ) {
          setProfile(null);
          setMode("create");
          reset(getDefaultValues());
          setPageStatus("ready");
          return;
        }

        setApiError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadProfile();

    return () => {
      shouldIgnore = true;
    };
  }, [reset]);

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

    const payload = convertFormDataToPayload(formData);

    try {
      const result = await updateMyCompanyMemberProfile(payload);

      setProfile(result.data);
      setMode("edit");
      reset(getDefaultValues(result.data));
      setSuccessMessage(result.message);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  if (pageStatus === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading your profile...</p>
        </CardBody>
      </Card>
    );
  }

  if (pageStatus === "company-missing") {
    return (
      <CompanySetupRequired description="Create your company profile before completing your personal company profile." />
    );
  }

  if (pageStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load your profile"
        description={apiError}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="My profile"
        title={
          mode === "create"
            ? "Complete your personal profile"
            : "Manage your profile"
        }
        description="Keep your personal company workspace details and profile photo up to date."
        actions={
          <Button as={Link} to="/company/dashboard" variant="secondary">
            Back to dashboard
          </Button>
        }
      />

      {apiError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {apiError}
        </div>
      )}

      {successMessage && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="grid gap-6">
          <ProfilePreviewCard
            values={watchedValues}
            user={user}
            profile={profile}
          />

          <ProfilePhotoManager
            user={user}
            updateUser={updateUser}
            name={fullName}
            description="Upload a clear photo so teammates and candidates can recognize your account."
          />

          <AccountInfoCard user={user} profile={profile} />
        </aside>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Personal details
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Your company workspace profile
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                These details help identify you inside your company hiring
                workspace.
              </p>
            </CardHeader>

            <CardBody>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="First name"
                  htmlFor="firstName"
                  error={errors.firstName?.message}
                >
                  <input
                    id="firstName"
                    type="text"
                    {...register("firstName")}
                    className={getInputClassName(Boolean(errors.firstName))}
                    placeholder="Sahil"
                  />
                </FormField>

                <FormField
                  label="Last name"
                  htmlFor="lastName"
                  error={errors.lastName?.message}
                >
                  <input
                    id="lastName"
                    type="text"
                    {...register("lastName")}
                    className={getInputClassName(Boolean(errors.lastName))}
                    placeholder="Pawar"
                  />
                </FormField>

                <FormField
                  label="Job title"
                  htmlFor="jobTitle"
                  error={errors.jobTitle?.message}
                >
                  <input
                    id="jobTitle"
                    type="text"
                    {...register("jobTitle")}
                    className={getInputClassName(Boolean(errors.jobTitle))}
                    placeholder="Founder, HR Manager, Technical Recruiter"
                  />
                </FormField>

                <FormField
                  label="Phone"
                  htmlFor="phone"
                  error={errors.phone?.message}
                  hint="Optional. Maximum 20 characters."
                >
                  <input
                    id="phone"
                    type="text"
                    {...register("phone")}
                    className={getInputClassName(Boolean(errors.phone))}
                    placeholder="+91 98765 43210"
                  />
                </FormField>
              </div>
            </CardBody>

            <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                as={Link}
                to="/company/dashboard"
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "create"
                    ? "Create profile"
                    : "Save changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CompanyMyProfilePage;
