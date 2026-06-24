import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createManagedJob } from "../../api/job.api";

import { createJobSchema } from "../../features/jobs/job.schemas";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/jobs/job.constants";

import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";

const defaultValues = {
  title: "",
  description: "",
  responsibilitiesText: "",
  requirementsText: "",
  skillsText: "",
  location: "",
  employmentType: "",
  workplaceType: "",
  experienceLevel: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "INR",
  isSalaryVisible: true,
};

const splitLines = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitCommaList = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const convertFormDataToPayload = (formData) => {
  return {
    title: formData.title,
    description: formData.description,

    responsibilities: splitLines(formData.responsibilitiesText),

    requirements: splitLines(formData.requirementsText),

    skills: splitCommaList(formData.skillsText),

    location: formData.location,
    employmentType: formData.employmentType,
    workplaceType: formData.workplaceType,
    experienceLevel: formData.experienceLevel,

    salaryMin: formData.salaryMin,
    salaryMax: formData.salaryMax,
    salaryCurrency: formData.salaryCurrency,
    isSalaryVisible: formData.isSalaryVisible,
  };
};

const CompanyJobFormPage = () => {
  const navigate = useNavigate();

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues,
  });

  const onSubmit = async (formData) => {
    setApiError("");

    const payload = convertFormDataToPayload(formData);

    try {
      await createManagedJob(payload);

      navigate("/company/jobs", {
        replace: true,
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Company jobs
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Create job
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create a new job posting for candidates to discover and apply.
        </p>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {apiError && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Job title
            </label>

            <input
              id="title"
              type="text"
              placeholder="Example: MERN Stack Developer"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("title")}
            />

            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Job description
            </label>

            <textarea
              id="description"
              rows={7}
              placeholder="Describe the role, team, work, and expectations."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("description")}
            />

            <FieldError message={errors.description?.message} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label
                htmlFor="employmentType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employment type
              </label>

              <select
                id="employmentType"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("employmentType")}
              >
                <option value="">Select employment type</option>

                {EMPLOYMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FieldError message={errors.employmentType?.message} />
            </div>

            <div>
              <label
                htmlFor="workplaceType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Workplace type
              </label>

              <select
                id="workplaceType"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("workplaceType")}
              >
                <option value="">Select workplace type</option>

                {WORKPLACE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FieldError message={errors.workplaceType?.message} />
            </div>

            <div>
              <label
                htmlFor="experienceLevel"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Experience level
              </label>

              <select
                id="experienceLevel"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("experienceLevel")}
              >
                <option value="">Select experience level</option>

                {EXPERIENCE_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <FieldError message={errors.experienceLevel?.message} />
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Location
            </label>

            <input
              id="location"
              type="text"
              placeholder="Example: Pune, India"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("location")}
            />

            <FieldError message={errors.location?.message} />
          </div>

          <div>
            <label
              htmlFor="skillsText"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Skills
            </label>

            <input
              id="skillsText"
              type="text"
              placeholder="React, Node.js, MongoDB"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("skillsText")}
            />

            <p className="mt-1 text-xs text-slate-500">
              Separate skills with commas.
            </p>

            <FieldError message={errors.skillsText?.message} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="responsibilitiesText"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Responsibilities
              </label>

              <textarea
                id="responsibilitiesText"
                rows={6}
                placeholder={`Build frontend features\nIntegrate backend APIs\nWrite clean reusable code`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("responsibilitiesText")}
              />

              <p className="mt-1 text-xs text-slate-500">
                Write one responsibility per line.
              </p>

              <FieldError message={errors.responsibilitiesText?.message} />
            </div>

            <div>
              <label
                htmlFor="requirementsText"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Requirements
              </label>

              <textarea
                id="requirementsText"
                rows={6}
                placeholder={`Good JavaScript knowledge\nReact project experience\nBasic REST API understanding`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("requirementsText")}
              />

              <p className="mt-1 text-xs text-slate-500">
                Write one requirement per line.
              </p>

              <FieldError message={errors.requirementsText?.message} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_140px]">
            <div>
              <label
                htmlFor="salaryMin"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Minimum salary
              </label>

              <input
                id="salaryMin"
                type="number"
                min="0"
                placeholder="300000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("salaryMin")}
              />

              <FieldError message={errors.salaryMin?.message} />
            </div>

            <div>
              <label
                htmlFor="salaryMax"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Maximum salary
              </label>

              <input
                id="salaryMax"
                type="number"
                min="0"
                placeholder="700000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("salaryMax")}
              />

              <FieldError message={errors.salaryMax?.message} />
            </div>

            <div>
              <label
                htmlFor="salaryCurrency"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Currency
              </label>

              <input
                id="salaryCurrency"
                type="text"
                maxLength={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("salaryCurrency")}
              />

              <FieldError message={errors.salaryCurrency?.message} />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("isSalaryVisible")}
            />

            <span className="text-sm font-medium text-slate-700">
              Show salary on public job page
            </span>
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/company/jobs"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyJobFormPage;
