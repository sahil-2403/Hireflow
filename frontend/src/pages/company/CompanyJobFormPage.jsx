import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createManagedJob,
  getManagedJobById,
  updateManagedJob,
} from "../../api/job.api";

import { getMyCompany } from "../../api/company.api";

import { createJobSchema } from "../../features/jobs/job.schemas";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/jobs/job.constants";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import TextInput from "../../components/ui/TextInput";
import TextareaInput from "../../components/ui/TextareaInput";
import SelectInput from "../../components/ui/SelectInput";
import PageHero from "../../components/ui/PageHero";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyJobPostAssistantCard from "../../components/ai/CompanyJobPostAssistantCard";

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

  const [pageStatus, setPageStatus] = useState("loading");

  const [aiJobPostAvailability, setAiJobPostAvailability] = useState(null);

  const [apiError, setApiError] = useState("");

  const [isCompanyMissing, setIsCompanyMissing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues,
  });

  useEffect(() => {
    let shouldIgnore = false;

    const loadPage = async () => {
      try {
        setPageStatus("loading");
        setApiError("");
        setIsCompanyMissing(false);

        /*
         * The existing company GET supplies
         * both company-profile eligibility
         * and AI usage.
         */
        const [companyResult, jobResult] = await Promise.all([
          getMyCompany(),

          isEditMode ? getManagedJobById(jobId) : Promise.resolve(null),
        ]);

        if (shouldIgnore) {
          return;
        }

        setAiJobPostAvailability(
          companyResult.data?.aiJobPostAssistant || null,
        );

        if (isEditMode) {
          reset(getDefaultValuesFromJob(jobResult.data));
        }

        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (isCompanyProfileMissingError(normalizedError)) {
          setIsCompanyMissing(true);

          setAiJobPostAvailability(null);

          setPageStatus("ready");

          return;
        }

        setApiError(normalizedError.message);

        setPageStatus("error");
      }
    };

    loadPage();

    return () => {
      shouldIgnore = true;
    };
  }, [isEditMode, jobId, reset]);

  const onSubmit = async (formData) => {
    setApiError("");
    setIsCompanyMissing(false);

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

      if (isCompanyProfileMissingError(normalizedError)) {
        setIsCompanyMissing(true);
      }

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

      {isCompanyMissing && (
        <CompanySetupRequired description="Create your company profile before posting a job." />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6"
        hidden={isCompanyMissing}
      >
        {apiError && <Alert variant="error">{apiError}</Alert>}

        <CompanyJobPostAssistantCard
          control={control}
          getValues={getValues}
          setValue={setValue}
          availability={aiJobPostAvailability}
        />

        <Card>
          <FormSectionTitle
            eyebrow="Basics"
            title="Job details"
            description="Add the core information candidates will see first."
          />

          <CardBody className="grid gap-5">
            <TextInput
              id="title"
              type="text"
              label="Job title"
              placeholder="Example: MERN Stack Developer"
              error={errors.title?.message}
              {...register("title")}
            />

            <TextareaInput
              id="description"
              label="Job description"
              rows={7}
              placeholder="Describe the role, team, work, and expectations."
              hint="Describe the role, team, work, expectations, and why the candidate should apply."
              error={errors.description?.message}
              {...register("description")}
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <SelectInput
                id="employmentType"
                label="Employment type"
                placeholder="Select employment type"
                options={EMPLOYMENT_TYPES}
                error={errors.employmentType?.message}
                {...register("employmentType")}
              />

              <SelectInput
                id="workplaceType"
                label="Workplace type"
                placeholder="Select workplace type"
                options={WORKPLACE_TYPES}
                error={errors.workplaceType?.message}
                {...register("workplaceType")}
              />

              <SelectInput
                id="experienceLevel"
                label="Experience level"
                placeholder="Select experience level"
                options={EXPERIENCE_LEVELS}
                error={errors.experienceLevel?.message}
                {...register("experienceLevel")}
              />
            </div>

            <TextInput
              id="location"
              type="text"
              label="Location"
              placeholder="Example: Pune, India"
              hint="Examples: Pune, India · Remote · Mumbai, India"
              error={errors.location?.message}
              {...register("location")}
            />

            <TextInput
              id="skillsText"
              type="text"
              label="Skills"
              placeholder="React, Node.js, MongoDB"
              hint="Separate skills with commas. Example: React, Node.js, MongoDB"
              error={errors.skillsText?.message}
              {...register("skillsText")}
            />
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
              <TextareaInput
                id="responsibilitiesText"
                label="Responsibilities"
                rows={7}
                placeholder={`Build frontend features\nIntegrate backend APIs\nWrite clean reusable code`}
                hint="Write one responsibility per line."
                error={errors.responsibilitiesText?.message}
                {...register("responsibilitiesText")}
              />

              <TextareaInput
                id="requirementsText"
                label="Requirements"
                rows={7}
                placeholder={`Good JavaScript knowledge\nReact project experience\nBasic REST API understanding`}
                hint="Write one requirement per line."
                error={errors.requirementsText?.message}
                {...register("requirementsText")}
              />
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
              <TextInput
                id="salaryMin"
                type="number"
                label="Minimum salary"
                min="0"
                placeholder="300000"
                error={errors.salaryMin?.message}
                {...register("salaryMin")}
              />

              <TextInput
                id="salaryMax"
                type="number"
                label="Maximum salary"
                min="0"
                placeholder="700000"
                error={errors.salaryMax?.message}
                {...register("salaryMax")}
              />

              <TextInput
                id="salaryCurrency"
                type="text"
                label="Currency"
                maxLength={3}
                error={errors.salaryCurrency?.message}
                inputClassName="uppercase"
                {...register("salaryCurrency")}
              />
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
