import { useEffect, useRef, useState } from "react";

import { Globe2, LoaderCircle, MapPin, Trash2, Upload } from "lucide-react";

import { Link } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCompanyProfile,
  deleteCompanyLogo,
  getMyCompany,
  updateCompanyProfile,
  uploadCompanyLogo,
} from "../../api/company.api";

import CompanyLogo from "../../components/common/CompanyLogo";

import CompanyProfilePageSkeleton from "../../components/loading/CompanyProfilePageSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "../../components/ui/Card";

import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";
import SelectInput from "../../components/ui/SelectInput";
import TextareaInput from "../../components/ui/TextareaInput";
import TextInput from "../../components/ui/TextInput";

import { COMPANY_SIZES } from "../../features/companies/company.constants";
import { companyProfileSchema } from "../../features/companies/company.schemas";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getDefaultValues = (company = null) => {
  return {
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    companySize: company?.companySize ?? "",
    websiteUrl: company?.websiteUrl ?? "",
    description: company?.description ?? "",
    headquarters: company?.headquarters ?? "",
  };
};

const convertFormDataToPayload = (formData) => {
  return {
    name: formData.name,
    industry: formData.industry,
    companySize: formData.companySize,
    websiteUrl: formData.websiteUrl || null,
    description: formData.description || null,
    headquarters: formData.headquarters,
  };
};

const validateLogoFile = (file) => {
  if (!file) {
    return "Please select a logo file first.";
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WebP logo files are allowed.";
  }

  if (file.size > MAX_LOGO_SIZE) {
    return "Logo file must be 2 MB or smaller.";
  }

  return "";
};

const CompanyIdentityAndLogoCard = ({
  company,
  previewCompany,
  mode,
  selectedLogo,
  logoInputRef,
  logoError,
  isUploadingLogo,
  isDeletingLogo,
  onLogoChange,
  onLogoUpload,
  onDeleteLogo,
}) => {
  const companyDetails = [
    previewCompany?.industry || "Industry",
    previewCompany?.companySize
      ? `${previewCompany.companySize} employees`
      : "Company size",
  ];

  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col">
        <div className="flex min-w-0 items-start gap-4">
          <CompanyLogo
            company={company}
            name={previewCompany?.name || "Company"}
            size="xl"
            fallbackClassName="bg-blue-600 text-white"
          />

          <div className="min-w-0 flex-1">
            <h2 className="wrap-break-word text-lg font-semibold leading-7 text-slate-950">
              {previewCompany?.name || "Company name"}
            </h2>

            <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-600">
              {companyDetails.join(" · ")}
            </p>

            <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-sm leading-5 text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />

              <span className="wrap-break-word">
                {previewCompany?.headquarters || "Headquarters"}
              </span>
            </p>
          </div>
        </div>

        <p className="mt-5 wrap-break-word text-sm leading-6 text-slate-600">
          {previewCompany?.description ||
            "Add a short company description to help candidates understand your company."}
        </p>

        {previewCompany?.websiteUrl && (
          <Button
            as="a"
            href={previewCompany.websiteUrl}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
            className="mt-4 self-start"
          >
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Visit website
          </Button>
        )}

        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold leading-6 text-slate-950">
            Company logo
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload a JPG, PNG, or WebP logo. Maximum size is 2 MB.
          </p>

          <div className="mt-4">
            <label
              htmlFor="company-logo"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Choose logo
            </label>

            <input
              id="company-logo"
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onLogoChange}
              className={[
                "block w-full",
                "rounded-xl border border-slate-200",
                "bg-white px-3 py-2",
                "text-sm text-slate-700",
                "file:mr-3 file:rounded-lg file:border-0",
                "file:bg-blue-50 file:px-3 file:py-2",
                "file:text-sm file:font-medium file:text-blue-700",
                "hover:file:bg-blue-100",
              ].join(" ")}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              JPG, PNG or WebP. Maximum 2 MB.
            </p>

            {selectedLogo && (
              <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-600">
                Selected:{" "}
                <span className="font-medium text-slate-900">
                  {selectedLogo.name}
                </span>
              </p>
            )}

            {mode === "create" && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                The selected logo will be uploaded when you create the company
                profile.
              </p>
            )}
          </div>

          {logoError && (
            <Alert variant="error" className="mt-4">
              {logoError}
            </Alert>
          )}

          {mode === "edit" && (
            <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
              <Button
                type="button"
                size="sm"
                disabled={isUploadingLogo || isDeletingLogo || !selectedLogo}
                onClick={onLogoUpload}
                fullWidth
              >
                {isUploadingLogo ? (
                  <>
                    <LoaderCircle
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {company?.logoUrl ? "Change logo" : "Upload logo"}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={
                  isUploadingLogo || isDeletingLogo || !company?.logoUrl
                }
                onClick={onDeleteLogo}
                fullWidth
              >
                {isDeletingLogo ? (
                  <>
                    <LoaderCircle
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove logo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const CompanyProfilePage = () => {
  const logoInputRef = useRef(null);

  const [pageStatus, setPageStatus] = useState("loading");
  const [mode, setMode] = useState("edit");
  const [company, setCompany] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = useWatch({ control }) ?? getDefaultValues();

  const previewCompany = {
    ...company,
    ...watchedValues,
  };

  const clearSelectedLogo = () => {
    setSelectedLogo(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    let shouldIgnore = false;

    const loadCompany = async () => {
      try {
        const result = await getMyCompany();

        if (shouldIgnore) {
          return;
        }

        setCompany(result.data);
        setMode("edit");
        setLoadError("");
        reset(getDefaultValues(result.data));
        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (normalizedError.statusCode === 404) {
          setCompany(null);
          setMode("create");
          setLoadError("");
          reset(getDefaultValues());
          setPageStatus("ready");
          return;
        }

        setLoadError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadCompany();

    return () => {
      shouldIgnore = true;
    };
  }, [loadAttempt, reset]);

  const handleRetryLoad = () => {
    setLoadError("");
    setPageStatus("loading");
    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const onSubmit = async (formData) => {
    setFormError("");

    const payload = convertFormDataToPayload(formData);

    try {
      const result =
        mode === "edit"
          ? await updateCompanyProfile(payload)
          : await createCompanyProfile(payload, selectedLogo);

      setCompany(result.data);
      setMode("edit");
      reset(getDefaultValues(result.data));
      clearSelectedLogo();

      notify.success(
        result.message ||
          (mode === "edit"
            ? "Company profile updated successfully."
            : "Company profile created successfully."),
      );
    } catch (error) {
      const normalizedError = getApiError(error);

      setFormError(normalizedError.message);
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;

    setLogoError("");

    if (!file) {
      clearSelectedLogo();
      return;
    }

    const validationError = validateLogoFile(file);

    if (validationError) {
      clearSelectedLogo();
      setLogoError(validationError);
      return;
    }

    setSelectedLogo(file);
  };

  const handleLogoUpload = async () => {
    const validationError = validateLogoFile(selectedLogo);

    if (validationError) {
      setLogoError(validationError);
      return;
    }

    try {
      setIsUploadingLogo(true);
      setLogoError("");

      const result = await uploadCompanyLogo(selectedLogo);

      setCompany(result.data);
      clearSelectedLogo();

      notify.success(result.message || "Company logo updated successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setLogoError(normalizedError.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    const confirmed = window.confirm(
      "Remove your company logo? Candidates will see your company initial instead.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingLogo(true);
      setLogoError("");

      const result = await deleteCompanyLogo();

      setCompany(result.data);
      clearSelectedLogo();

      notify.success(result.message || "Company logo removed successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setLogoError(normalizedError.message);
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const isLoading = pageStatus === "loading";
  const hasLoadError = pageStatus === "error";
  const isReady = pageStatus === "ready";

  const pageTitle =
    mode === "edit" ? "Edit company profile" : "Create company profile";

  return (
    <div className="grid gap-5">
      <PageHero
        title={pageTitle}
        description="Set up your company information so jobs, dashboards, and public listings show accurate details."
      />

      {isLoading && <CompanyProfilePageSkeleton />}

      {hasLoadError && (
        <SectionError
          title="Could not load company profile"
          message={loadError}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-stretch">
          <CompanyIdentityAndLogoCard
            company={company}
            previewCompany={previewCompany}
            mode={mode}
            selectedLogo={selectedLogo}
            logoInputRef={logoInputRef}
            logoError={logoError}
            isUploadingLogo={isUploadingLogo}
            isDeletingLogo={isDeletingLogo}
            onLogoChange={handleLogoChange}
            onLogoUpload={handleLogoUpload}
            onDeleteLogo={handleDeleteLogo}
          />

          <form
            onSubmit={(e) => {
              // Avoid calling handleSubmit during render to prevent accessing refs during render
              return handleSubmit(onSubmit)(e);
            }}
            className="h-full"
          >
            <Card className="flex h-full flex-col">
              <CardHeader>
                <h2 className="text-lg font-semibold leading-7 text-slate-950">
                  Company information
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Add the core details used across your jobs and company pages.
                </p>
              </CardHeader>

              <CardBody className="flex-1">
                {formError && (
                  <Alert variant="error" className="mb-5">
                    {formError}
                  </Alert>
                )}

                <div className="grid gap-5">
                  <TextInput
                    id="name"
                    type="text"
                    label="Company name"
                    placeholder="Example: HireFlow Technologies"
                    error={errors.name?.message}
                    {...register("name")}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      id="industry"
                      type="text"
                      label="Industry"
                      placeholder="Example: Software Development"
                      error={errors.industry?.message}
                      {...register("industry")}
                    />

                    <SelectInput
                      id="companySize"
                      label="Company size"
                      placeholder="Select company size"
                      options={COMPANY_SIZES}
                      error={errors.companySize?.message}
                      {...register("companySize")}
                    />
                  </div>

                  <TextInput
                    id="headquarters"
                    type="text"
                    label="Headquarters"
                    placeholder="Example: Pune, Maharashtra"
                    error={errors.headquarters?.message}
                    {...register("headquarters")}
                  />

                  <TextInput
                    id="websiteUrl"
                    type="url"
                    label="Website URL"
                    placeholder="https://example.com"
                    hint="Optional. Example: https://example.com"
                    error={errors.websiteUrl?.message}
                    {...register("websiteUrl")}
                  />

                  <TextareaInput
                    id="description"
                    label="Description"
                    rows={6}
                    placeholder="Write a short company description."
                    hint="Optional. Keep it short and candidate-friendly."
                    error={errors.description?.message}
                    {...register("description")}
                  />
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
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                      ? "Update profile"
                      : "Create profile"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyProfilePage;
