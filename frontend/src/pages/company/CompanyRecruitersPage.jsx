import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
} from "../../api/company.api";

import { createRecruiterSchema } from "../../features/companies/recruiter.schemas";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import PasswordField from "../../components/common/PasswordField";

import ProfileAvatar from "../../components/common/ProfileAvatar";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

const defaultValues = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
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

const getRecruiterId = (recruiter) => {
  return recruiter._id || recruiter.id;
};

const getRecruiterUsername = (recruiter) => {
  return recruiter.username || recruiter.userId?.username || "unknown";
};

const getRecruiterEmail = (recruiter) => {
  return recruiter.email || recruiter.userId?.email || "Email unavailable";
};

const getRecruiterStatus = (recruiter) => {
  return recruiter.isActive ? "Active" : "Inactive";
};

const getRecruiterName = (recruiter) => {
  const name = [recruiter.firstName, recruiter.lastName]
    .filter(Boolean)
    .join(" ");

  return name || getRecruiterUsername(recruiter);
};

const RecruiterStatusPill = ({ recruiter }) => {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
        recruiter.isActive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      {getRecruiterStatus(recruiter)}
    </span>
  );
};

const CompanyRecruitersPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [recruiters, setRecruiters] = useState([]);

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [updatingRecruiterId, setUpdatingRecruiterId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRecruiterSchema),
    defaultValues,
  });

  useEffect(() => {
    let shouldIgnore = false;

    const fetchRecruiters = async () => {
      try {
        setRequestStatus("loading");
        setApiError("");

        const result = await listRecruiters();

        if (shouldIgnore) {
          return;
        }

        setRecruiters(result.data ?? []);
        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setApiError(normalizedError.message);

        setRecruiters([]);
        setRequestStatus(
          isCompanyProfileMissingError(normalizedError)
            ? "company-missing"
            : "error",
        );
      }
    };

    fetchRecruiters();

    return () => {
      shouldIgnore = true;
    };
  }, [refreshKey]);

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

    try {
      const result = await createRecruiter(formData);

      setSuccessMessage(result.message);

      reset(defaultValues);

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  const handleToggleRecruiterStatus = async (recruiter) => {
    const recruiterId = getRecruiterId(recruiter);

    const nextStatus = !recruiter.isActive;

    try {
      setUpdatingRecruiterId(recruiterId);
      setApiError("");
      setSuccessMessage("");

      const result = await updateRecruiterStatus(recruiterId, nextStatus);

      setSuccessMessage(result.message);

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    } finally {
      setUpdatingRecruiterId(null);
    }
  };

  const activeRecruiters = recruiters.filter((recruiter) => recruiter.isActive);
  const inactiveRecruiters = recruiters.filter(
    (recruiter) => !recruiter.isActive,
  );

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Recruiters"
        title="Manage recruiters"
        description="Create recruiter accounts and activate or deactivate access to your company hiring workspace."
        meta={
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-black text-emerald-700">
                {activeRecruiters.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total
              </p>

              <p className="mt-1 text-2xl font-black text-slate-950">
                {recruiters.length}
              </p>
            </div>
          </div>
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

      {requestStatus === "company-missing" && (
        <CompanySetupRequired description="Create your company profile before inviting recruiters." />
      )}

      {requestStatus !== "company-missing" && (
        <div className="grid gap-6 xl:grid-cols-[750px_1fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                    Team access
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Recruiter accounts
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Active recruiters can log in and work on company jobs and
                    applications.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  {inactiveRecruiters.length} inactive
                </div>
              </div>
            </CardHeader>

            <CardBody>
              {requestStatus === "loading" && (
                <p className="text-sm text-slate-600">Loading recruiters...</p>
              )}

              {requestStatus === "error" && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  Could not load recruiters.
                </div>
              )}

              {requestStatus === "success" && recruiters.length === 0 && (
                <EmptyState
                  icon="🤝"
                  title="No recruiters created yet"
                  description="Create your first recruiter account to let your team manage jobs and applications."
                />
              )}

              {requestStatus === "success" && recruiters.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {recruiters.map((recruiter) => {
                    const recruiterId = getRecruiterId(recruiter);

                    return (
                      <article
                        key={recruiterId}
                        className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[2fr_0.5fr_auto] lg:items-center"
                      >
                        <div className="flex gap-4">
                          <ProfileAvatar
                            user={recruiter.userId}
                            name={getRecruiterName(recruiter)}
                            size="md"
                            fallbackClassName="bg-blue-50 text-blue-700"
                          />

                          <div>
                            <p className="font-black text-slate-950">
                              {getRecruiterName(recruiter)}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              {recruiter.jobTitle || "Recruiter"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              @{getRecruiterUsername(recruiter)}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {getRecruiterEmail(recruiter)}
                            </p>
                          </div>

                          <div className="flex flex-col mr-5 w-full place-items-end self-center">
                            <RecruiterStatusPill recruiter={recruiter} />
                          </div>
                        </div>

                        <Button
                          type="button"
                          disabled={updatingRecruiterId === recruiterId}
                          onClick={() => handleToggleRecruiterStatus(recruiter)}
                          variant={recruiter.isActive ? "danger" : "secondary"}
                          size="sm"
                          className={
                            recruiter.isActive
                              ? ""
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }
                        >
                          {updatingRecruiterId === recruiterId
                            ? "Updating..."
                            : recruiter.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="self-start xl:sticky xl:top-24">
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                New recruiter
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Create recruiter
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Recruiters can manage jobs and applications. Only owners can
                manage company profile and recruiter access.
              </p>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <FormField
                    label="First name"
                    htmlFor="firstName"
                    error={errors.firstName?.message}
                  >
                    <input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      className={getInputClassName(Boolean(errors.firstName))}
                      {...register("firstName")}
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
                      placeholder="Last name"
                      className={getInputClassName(Boolean(errors.lastName))}
                      {...register("lastName")}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Job title"
                  htmlFor="jobTitle"
                  error={errors.jobTitle?.message}
                >
                  <input
                    id="jobTitle"
                    type="text"
                    placeholder="Technical Recruiter"
                    className={getInputClassName(Boolean(errors.jobTitle))}
                    {...register("jobTitle")}
                  />
                </FormField>

                <FormField
                  label="Username"
                  htmlFor="username"
                  error={errors.username?.message}
                  hint="Only letters, numbers, and underscores are allowed."
                >
                  <input
                    id="username"
                    type="text"
                    placeholder="recruiter_one"
                    className={getInputClassName(Boolean(errors.username))}
                    {...register("username")}
                  />
                </FormField>

                <FormField
                  label="Email"
                  htmlFor="email"
                  error={errors.email?.message}
                >
                  <input
                    id="email"
                    type="email"
                    placeholder="recruiter@example.com"
                    className={getInputClassName(Boolean(errors.email))}
                    {...register("email")}
                  />
                </FormField>

                <PasswordField
                  id="password"
                  label="Temporary password"
                  placeholder="Recruiter123"
                  registration={register("password")}
                  error={errors.password?.message}
                />

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  Password must contain at least 8 characters, one uppercase
                  letter, one lowercase letter, and one number.
                </div>

                <Button type="submit" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? "Creating..." : "Create recruiter"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompanyRecruitersPage;
