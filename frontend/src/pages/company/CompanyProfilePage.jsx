import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCompanyProfile,
  getMyCompany,
  updateCompanyProfile,
  uploadCompanyLogo,
  deleteCompanyLogo,
} from "../../api/company.api";

import { companyProfileSchema } from "../../features/companies/company.schemas";

import { COMPANY_SIZES } from "../../features/companies/company.constants";

import getApiError from "../../utils/getApiError";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";
import TextareaInput from "../../components/ui/TextareaInput";
import PageHero from "../../components/ui/PageHero";

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

const getCompanyInitial = (company) => {
  return (company?.name || "H").slice(0, 1).toUpperCase();
};

const CompanyPreviewCard = ({ company }) => {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Preview
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          Public company identity
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          This is the information candidates will associate with your jobs.
        </p>
      </CardHeader>

      <CardBody>
        <div className="flex gap-4">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={`${company.name} logo`}
              className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-sm shadow-blue-200">
              {getCompanyInitial(company)}
            </div>
          )}

          <div>
            <p className="text-lg font-black text-slate-950">
              {company?.name || "Company name"}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {company?.industry || "Industry"} ·{" "}
              {company?.companySize || "Company size"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {company?.headquarters || "Headquarters"}
            </p>
          </div>
        </div>

        {company?.description ? (
          <p className="mt-5 text-sm leading-6 text-slate-600">
            {company.description}
          </p>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
            Add a company description to help candidates understand your
            company.
          </p>
        )}

        {company?.websiteUrl && (
          <Button
            as="a"
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            fullWidth
            className="mt-5"
          >
            Visit website
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

const CompanyProfilePage = () => {
  const [pageStatus, setPageStatus] = useState("loading");

  const [mode, setMode] = useState("create");

  const [company, setCompany] = useState(null);

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [selectedLogo, setSelectedLogo] = useState(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

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
          reset(getDefaultValues());
          setPageStatus("ready");
          return;
        }

        setApiError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadCompany();

    return () => {
      shouldIgnore = true;
    };
  }, [reset]);

  const onSubmit = async (formData) => {
    setApiError("");
    setSuccessMessage("");

    const payload = convertFormDataToPayload(formData);

    try {
      const result =
        mode === "edit"
          ? await updateCompanyProfile(payload)
          : await createCompanyProfile(payload, selectedLogo);

      setCompany(result.data);
      setMode("edit");
      setSuccessMessage(result.message);
      setSelectedLogo(null);

      reset(getDefaultValues(result.data));
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    setApiError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedLogo(null);
      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setSelectedLogo(null);
      setApiError("Only JPG, PNG, or WebP logo files are allowed.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setSelectedLogo(null);
      setApiError("Logo file must be 2 MB or smaller.");
      return;
    }

    setSelectedLogo(file);
  };

  const handleLogoUpload = async () => {
    setApiError("");
    setSuccessMessage("");

    if (!selectedLogo) {
      setApiError("Please select a logo file first.");
      return;
    }

    try {
      setIsUploadingLogo(true);

      const result = await uploadCompanyLogo(selectedLogo);

      setCompany(result.data);
      setSelectedLogo(null);
      setSuccessMessage(result.message);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
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
      setApiError("");
      setSuccessMessage("");

      const result = await deleteCompanyLogo();

      setCompany(result.data);
      setSelectedLogo(null);
      setSuccessMessage(result.message);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    } finally {
      setIsDeletingLogo(false);
    }
  };

  if (pageStatus === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading company profile...</p>
        </CardBody>
      </Card>
    );
  }

  if (pageStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load company profile"
        description={apiError}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHero
        title={
          mode === "edit" ? "Edit company profile" : "Create company profile"
        }
        description="Set up your company information so jobs, dashboards, and public listings show accurate details."
        actions={
          <Button as={Link} to="/company/dashboard" variant="secondary">
            Back to dashboard
          </Button>
        }
      />

      {apiError && <Alert variant="error">{apiError}</Alert>}

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Logo
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Company logo
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Upload a JPG, PNG, or WebP logo. Maximum size is 2 MB.
              </p>
            </CardHeader>

            <CardBody>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {company?.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500">
                    No logo
                  </div>
                )}

                <div className="flex-1">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <label
                        htmlFor="logo"
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Logo file
                      </label>

                      <input
                        id="logo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleLogoChange}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                      />

                      {selectedLogo && (
                        <p className="mt-2 text-sm text-slate-600">
                          Selected file:{" "}
                          <span className="font-bold text-slate-900">
                            {selectedLogo.name}
                          </span>
                        </p>
                      )}

                      {mode === "create" && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Optional. The selected logo will be uploaded when you
                          create the company profile.
                        </p>
                      )}
                    </div>

                    {mode === "edit" && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          disabled={
                            isUploadingLogo || isDeletingLogo || !selectedLogo
                          }
                          onClick={handleLogoUpload}
                        >
                          {isUploadingLogo
                            ? "Uploading..."
                            : company?.logoUrl
                              ? "Change logo"
                              : "Upload logo"}
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          disabled={
                            isUploadingLogo ||
                            isDeletingLogo ||
                            !company?.logoUrl
                          }
                          onClick={handleDeleteLogo}
                        >
                          {isDeletingLogo ? "Removing..." : "Remove logo"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Details
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Company information
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Add the core details used across your jobs and company pages.
                </p>
              </CardHeader>

              <CardBody className="grid gap-5">
                <TextInput
                  id="name"
                  type="text"
                  label="Company name"
                  placeholder="Example: HireFlow Technologies"
                  error={errors.name?.message}
                  {...register("name")}
                />

                <div className="grid gap-5 lg:grid-cols-2">
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
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {mode === "edit"
                      ? "Ready to update company profile?"
                      : "Ready to create company profile?"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    These details will be visible wherever company information
                    is displayed.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button as={Link} to="/company/dashboard" variant="secondary">
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
                </div>
              </CardBody>
            </Card>
          </form>
        </div>

        <aside className="self-start xl:sticky xl:top-24">
          <CompanyPreviewCard company={previewCompany} mode={mode} />
        </aside>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
