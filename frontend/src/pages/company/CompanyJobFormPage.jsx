import { useEffect, useState } from "react";

import { ArrowLeft, LoaderCircle, Save } from "lucide-react";

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

  if (pageStatus === "loading") {
    return <CompanyJobFormPageSkeleton />;
  }

  if (pageStatus === "error") {
    return (
      <div className="grid gap-5">
        <Button as={Link} to="/company/jobs" variant="ghost" className="w-fit">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Button>

        <SectionError
          title={
            isEditMode ? "Could not load job" : "Could not prepare job form"
          }
          message={apiError}
          onRetry={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHero
        title={isEditMode ? "Edit job" : "Create job"}
        description={
          isEditMode
            ? "Update the listing while keeping its responsibilities, requirements, compensation, and public information accurate."
            : "Create a structured job post that candidates can discover, understand, and apply to."
        }
        actions={
          <Button as={Link} to="/company/jobs" variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to jobs
          </Button>
        }
      />

      {isCompanyMissing ? (
        <CompanySetupRequired description="Create your company profile before posting or editing a job." />
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-6"
          noValidate
        >
          {apiError && <Alert variant="error">{apiError}</Alert>}

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
            <CompanyJobFormFields register={register} errors={errors} />

            <aside className="min-w-0">
              <CompanyJobPostAssistantCard
                control={control}
                getValues={getValues}
                setValue={setValue}
                availability={aiJobPostAvailability}
              />
            </aside>
          </div>

          <Card className="sticky bottom-3 z-20 border-slate-200 bg-white/90 shadow-lg shadow-slate-200/50 backdrop-blur">
            <CardBody className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div>
                <p className="text-sm font-semibold leading-5 text-slate-900">
                  {isEditMode
                    ? "Ready to update this job?"
                    : "Ready to publish this job?"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {isEditMode
                    ? "Saved changes will update the public job listing."
                    : "The listing will become available to candidates after creation."}
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
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
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
