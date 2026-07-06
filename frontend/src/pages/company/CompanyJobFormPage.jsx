import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createManagedJob,
  getManagedJobById,
  updateManagedJob,
} from "../../api/job.api";

import { createJobSchema } from "../../features/jobs/job.schemas";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/jobs/job.constants";

import getApiError from "../../utils/getApiError";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

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

const getInputClassName = (hasError = false) => {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-50"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
  ].join(" ");
};

const getTextareaClassName = (hasError = false) => {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:ring-4",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-50"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
  ].join(" ");
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

const getDefaultValuesFromJob = (job) => {
  if (!job) {
    return defaultValues;
  }

  return {
    title: job.title ?? "",
    description: job.description ?? "",

    responsibilitiesText: Array.isArray(job.responsibilities)
      ? job.responsibilities.join("\n")
      : "",

    requirementsText: Array.isArray(job.requirements)
      ? job.requirements.join("\n")
      : "",

    skillsText: Array.isArray(job.skills) ? job.skills.join(", ") : "",

    location: job.location ?? "",
    employmentType: job.employmentType ?? "",
    workplaceType: job.workplaceType ?? "",
    experienceLevel: job.experienceLevel ?? "",
    salaryMin:
      job.salaryMin === null || job.salaryMin === undefined
        ? ""
        : String(job.salaryMin),

    salaryMax:
      job.salaryMax === null || job.salaryMax === undefined
        ? ""
        : String(job.salaryMax),
    salaryCurrency: job.salaryCurrency ?? "INR",
    isSalaryVisible: Boolean(job.isSalaryVisible),
  };
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

const FormSectionTitle = ({ eyebrow, title, description }) => {
  return (
    <CardHeader>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      )}
    </CardHeader>
  );
};

const CompanyJobFormPage = () => {
  const { jobId } = useParams();

  const navigate = useNavigate();

  const isEditMode = Boolean(jobId);

  const [pageStatus, setPageStatus] = useState(
    isEditMode ? "loading" : "ready",
  );

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let shouldIgnore = false;

    const loadJob = async () => {
      try {
        setPageStatus("loading");
        setApiError("");

        const result = await getManagedJobById(jobId);

        if (shouldIgnore) {
          return;
        }

        reset(getDefaultValuesFromJob(result.data));

        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setApiError(normalizedError.message);

        setPageStatus("error");
      }
    };

    loadJob();

    return () => {
      shouldIgnore = true;
    };
  }, [isEditMode, jobId, reset]);

  const onSubmit = async (formData) => {
    setApiError("");

    const payload = convertFormDataToPayload(formData);

    try {
      if (isEditMode) {
        await updateManagedJob(jobId, payload);
      } else {
        await createManagedJob(payload);
      }

      navigate("/company/jobs", {
        replace: true,
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  if (pageStatus === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading job details...</p>
        </CardBody>
      </Card>
    );
  }

  if (pageStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load job"
        description={apiError}
        action={
          <Button as={Link} to="/company/jobs">
            Back to jobs
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company jobs"
        title={isEditMode ? "Edit job" : "Create job"}
        description={
          isEditMode
            ? "Update this job posting and keep the public listing accurate for candidates."
            : "Create a new job posting for candidates to discover and apply."
        }
        actions={
          <Button as={Link} to="/company/jobs" variant="secondary">
            Back to jobs
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        {apiError && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <Card>
          <FormSectionTitle
            eyebrow="Basics"
            title="Job details"
            description="Add the core information candidates will see first."
          />

          <CardBody className="grid gap-5">
            <FormField
              label="Job title"
              htmlFor="title"
              error={errors.title?.message}
            >
              <input
                id="title"
                type="text"
                placeholder="Example: MERN Stack Developer"
                className={getInputClassName(Boolean(errors.title))}
                {...register("title")}
              />
            </FormField>

            <FormField
              label="Job description"
              htmlFor="description"
              error={errors.description?.message}
              hint="Describe the role, team, work, expectations, and why the candidate should apply."
            >
              <textarea
                id="description"
                rows={7}
                placeholder="Describe the role, team, work, and expectations."
                className={getTextareaClassName(Boolean(errors.description))}
                {...register("description")}
              />
            </FormField>

            <div className="grid gap-5 lg:grid-cols-3">
              <FormField
                label="Employment type"
                htmlFor="employmentType"
                error={errors.employmentType?.message}
              >
                <select
                  id="employmentType"
                  className={getInputClassName(Boolean(errors.employmentType))}
                  {...register("employmentType")}
                >
                  <option value="">Select employment type</option>

                  {EMPLOYMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Workplace type"
                htmlFor="workplaceType"
                error={errors.workplaceType?.message}
              >
                <select
                  id="workplaceType"
                  className={getInputClassName(Boolean(errors.workplaceType))}
                  {...register("workplaceType")}
                >
                  <option value="">Select workplace type</option>

                  {WORKPLACE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Experience level"
                htmlFor="experienceLevel"
                error={errors.experienceLevel?.message}
              >
                <select
                  id="experienceLevel"
                  className={getInputClassName(Boolean(errors.experienceLevel))}
                  {...register("experienceLevel")}
                >
                  <option value="">Select experience level</option>

                  {EXPERIENCE_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField
              label="Location"
              htmlFor="location"
              error={errors.location?.message}
              hint="Examples: Pune, India · Remote · Mumbai, India"
            >
              <input
                id="location"
                type="text"
                placeholder="Example: Pune, India"
                className={getInputClassName(Boolean(errors.location))}
                {...register("location")}
              />
            </FormField>

            <FormField
              label="Skills"
              htmlFor="skillsText"
              hint="Separate skills with commas. Example: React, Node.js, MongoDB"
            >
              <input
                id="skillsText"
                type="text"
                placeholder="React, Node.js, MongoDB"
                className={getInputClassName(Boolean(errors.skillsText))}
                {...register("skillsText")}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <FormSectionTitle
            eyebrow="Role content"
            title="Responsibilities and requirements"
            description="Use one line for each point so the public job page can show clean bullet lists."
          />

          <CardBody>
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                label="Responsibilities"
                htmlFor="responsibilitiesText"
                hint="Write one responsibility per line."
              >
                <textarea
                  id="responsibilitiesText"
                  rows={7}
                  placeholder={`Build frontend features\nIntegrate backend APIs\nWrite clean reusable code`}
                  className={getTextareaClassName(
                    Boolean(errors.responsibilitiesText),
                  )}
                  {...register("responsibilitiesText")}
                />
              </FormField>

              <FormField
                label="Requirements"
                htmlFor="requirementsText"
                hint="Write one requirement per line."
              >
                <textarea
                  id="requirementsText"
                  rows={7}
                  placeholder={`Good JavaScript knowledge\nReact project experience\nBasic REST API understanding`}
                  className={getTextareaClassName(
                    Boolean(errors.requirementsText),
                  )}
                  {...register("requirementsText")}
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <FormSectionTitle
            eyebrow="Compensation"
            title="Salary information"
            description="Salary is optional, but visible salaries usually improve candidate trust."
          />

          <CardBody className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr_160px]">
              <FormField
                label="Minimum salary"
                htmlFor="salaryMin"
                error={errors.salaryMin?.message}
              >
                <input
                  id="salaryMin"
                  type="number"
                  min="0"
                  placeholder="300000"
                  className={getInputClassName(Boolean(errors.salaryMin))}
                  {...register("salaryMin")}
                />
              </FormField>

              <FormField
                label="Maximum salary"
                htmlFor="salaryMax"
                error={errors.salaryMax?.message}
              >
                <input
                  id="salaryMax"
                  type="number"
                  min="0"
                  placeholder="700000"
                  className={getInputClassName(Boolean(errors.salaryMax))}
                  {...register("salaryMax")}
                />
              </FormField>

              <FormField
                label="Currency"
                htmlFor="salaryCurrency"
                error={errors.salaryCurrency?.message}
              >
                <input
                  id="salaryCurrency"
                  type="text"
                  maxLength={3}
                  className={[
                    getInputClassName(Boolean(errors.salaryCurrency)),
                    "uppercase",
                  ].join(" ")}
                  {...register("salaryCurrency")}
                />
              </FormField>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register("isSalaryVisible")}
              />

              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Show salary on public job page
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Turn this off if the company does not want to disclose salary
                  publicly.
                </span>
              </span>
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {isEditMode ? "Ready to update this job?" : "Ready to publish?"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {isEditMode
                  ? "Your changes will update the job posting."
                  : "Candidates will be able to discover this job once created."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to="/company/jobs" variant="secondary">
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update job"
                    : "Create job"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
};

export default CompanyJobFormPage;
