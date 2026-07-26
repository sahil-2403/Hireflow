import { useEffect, useState } from "react";

import { LoaderCircle, Save } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { getMyCompany } from "../../api/company.api";

import {
  createManagedJob,
  getManagedJobById,
  updateManagedJob,
} from "../../api/job.api";

import CompanyJobPostAssistantCard from "../../components/ai/CompanyJobPostAssistantCard";

import CompanyJobFormFields from "../../components/company/CompanyJobFormFields";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyJobFormPageSkeleton from "../../components/loading/CompanyJobFormPageSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";

import { createJobSchema } from "../../features/jobs/job.schemas";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";
import notify from "../../utils/notify";

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

const CompanyJobFormPage = () => {
  const { jobId } = useParams();

  const navigate = useNavigate();

  const isEditMode = Boolean(jobId);

  const [pageStatus, setPageStatus] = useState("loading");

  const [aiJobPostAvailability, setAiJobPostAvailability] = useState(null);

  const [apiError, setApiError] = useState("");

  const [isCompanyMissing, setIsCompanyMissing] = useState(false);

  const [loadAttempt, setLoadAttempt] = useState(0);

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
        } else {
          reset(defaultValues);
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
  }, [isEditMode, jobId, reset, loadAttempt]);

  const handleRetryLoad = () => {
    setApiError("");
    setPageStatus("loading");

    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const onSubmit = async (formData) => {
    setApiError("");
    setIsCompanyMissing(false);

    const payload = convertFormDataToPayload(formData);

    try {
      const result = isEditMode
        ? await updateManagedJob(jobId, payload)
        : await createManagedJob(payload);

      notify.success(
        result.message ||
          (isEditMode
            ? "Job updated successfully."
            : "Job created successfully."),
      );

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

  const isLoading = pageStatus === "loading";

  const hasLoadError = pageStatus === "error";

  const isReady = pageStatus === "ready";

  return (
    <div className="grid gap-5">
      <PageHero
        title={isEditMode ? "Edit job" : "Create job"}
        description={
          isEditMode
            ? "Update the listing while keeping its responsibilities, requirements, compensation, and public information accurate."
            : "Create a structured job post that candidates can discover, understand, and apply to."
        }
      />

      {isLoading && <CompanyJobFormPageSkeleton />}

      {hasLoadError && (
        <SectionError
          title={
            isEditMode ? "Could not load job" : "Could not prepare job form"
          }
          message={apiError}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && isCompanyMissing && (
        <CompanySetupRequired description="Create your company profile before posting or editing a job." />
      )}

      {isReady && !isCompanyMissing && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
        >
          {apiError && <Alert variant="error">{apiError}</Alert>}

          <CompanyJobPostAssistantCard
            control={control}
            getValues={getValues}
            setValue={setValue}
            availability={aiJobPostAvailability}
          />

          <CompanyJobFormFields register={register} errors={errors} />

          <Card className="sticky bottom-0 border-2 z-40">
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold leading-5 text-slate-900">
                  {isEditMode
                    ? "You're almost done"
                    : "Ready to publish this job?"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {isEditMode
                    ? "Review your changes and update the public job listing."
                    : "Review the job details before making the listing available to candidates."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  as={Link}
                  to="/company/jobs"
                  variant="secondary"
                  size="lg"
                >
                  Cancel
                </Button>

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />

                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden="true" />

                      {isEditMode ? "Update job" : "Create job"}
                    </>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}
    </div>
  );
};

export default CompanyJobFormPage;
