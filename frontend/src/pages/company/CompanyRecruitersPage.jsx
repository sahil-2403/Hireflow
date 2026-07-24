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
import Alert from "../../components/ui/Alert";
import Pill from "../../components/ui/Pill";
import TextInput from "../../components/ui/TextInput";
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
    <Pill variant={recruiter.isActive ? "emerald" : "slate"}>
      {getRecruiterStatus(recruiter)}
    </Pill>
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

      {apiError && <Alert variant="error">{apiError}</Alert>}

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

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
                <Alert variant="error">Could not load recruiters.</Alert>
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
                  <TextInput
                    id="firstName"
                    type="text"
                    label="First name"
                    placeholder="First name"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />

                  <TextInput
                    id="lastName"
                    type="text"
                    label="Last name"
                    placeholder="Last name"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                </div>

                <TextInput
                  id="jobTitle"
                  type="text"
                  label="Job title"
                  placeholder="Technical Recruiter"
                  error={errors.jobTitle?.message}
                  {...register("jobTitle")}
                />

                <TextInput
                  id="username"
                  type="text"
                  label="Username"
                  placeholder="recruiter_one"
                  hint="Only letters, numbers, and underscores are allowed."
                  error={errors.username?.message}
                  {...register("username")}
                />

                <TextInput
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="recruiter@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

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
