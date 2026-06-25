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

import FieldError from "../../components/common/FieldError";
import PasswordField from "../../components/common/PasswordField";

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
        setRequestStatus("error");
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

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Recruiters
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Manage recruiters
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create recruiter accounts and activate or deactivate access to your
          company hiring workspace.
        </p>
      </section>

      {apiError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {apiError}
        </div>
      )}

      {successMessage && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Create recruiter</h2>

        <p className="mt-1 text-sm text-slate-600">
          Recruiters can manage jobs and applications, but only owners can
          manage company profile and recruiters.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                First name
              </label>

              <input
                id="firstName"
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("firstName")}
              />

              <FieldError message={errors.firstName?.message} />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Last name
              </label>

              <input
                id="lastName"
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("lastName")}
              />

              <FieldError message={errors.lastName?.message} />
            </div>
          </div>

          <div>
            <label
              htmlFor="jobTitle"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Job title
            </label>

            <input
              id="jobTitle"
              type="text"
              placeholder="Technical Recruiter"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("jobTitle")}
            />

            <FieldError message={errors.jobTitle?.message} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="recruiter_one"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("username")}
              />

              <FieldError message={errors.username?.message} />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="recruiter@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("email")}
              />

              <FieldError message={errors.email?.message} />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Temporary password
            </label>

            <PasswordField
              id="password"
              placeholder="Recruiter123"
              registration={register("password")}
            />

            <p className="mt-1 text-xs text-slate-500">
              Must contain at least 8 characters, uppercase, lowercase, and a
              number.
            </p>

            <FieldError message={errors.password?.message} />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create recruiter"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Recruiter accounts</h2>

        <p className="mt-1 text-sm text-slate-600">
          Active recruiters can log in and work on company jobs and
          applications.
        </p>

        {requestStatus === "loading" && (
          <p className="mt-5 text-sm text-slate-600">Loading recruiters...</p>
        )}

        {requestStatus === "error" && (
          <p className="mt-5 text-sm text-red-700">
            Could not load recruiters.
          </p>
        )}

        {requestStatus === "success" && recruiters.length === 0 && (
          <p className="mt-5 text-sm text-slate-600">
            No recruiters created yet.
          </p>
        )}

        {requestStatus === "success" && recruiters.length > 0 && (
          <div className="mt-5 divide-y divide-slate-200">
            {recruiters.map((recruiter) => {
              const recruiterId = getRecruiterId(recruiter);

              return (
                <article
                  key={recruiterId}
                  className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {recruiter.firstName} {recruiter.lastName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {recruiter.jobTitle}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      @{getRecruiterUsername(recruiter)} ·{" "}
                      {getRecruiterEmail(recruiter)}
                    </p>
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        recruiter.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {getRecruiterStatus(recruiter)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={updatingRecruiterId === recruiterId}
                    onClick={() => handleToggleRecruiterStatus(recruiter)}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                      recruiter.isActive
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {updatingRecruiterId === recruiterId
                      ? "Updating..."
                      : recruiter.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CompanyRecruitersPage;
