import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCompanyProfile,
  getPublicCompany,
  updateCompanyProfile,
  uploadCompanyLogo,
} from "../../api/company.api";

import { companyProfileSchema } from "../../features/companies/company.schemas";

import { COMPANY_SIZES } from "../../features/companies/company.constants";

import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";

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

const CompanyProfilePage = () => {
  const [pageStatus, setPageStatus] = useState("loading");

  const [mode, setMode] = useState("create");

  const [company, setCompany] = useState(null);

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [selectedLogo, setSelectedLogo] = useState(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    let shouldIgnore = false;

    const loadCompany = async () => {
      try {
        const result = await getPublicCompany();

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
          : await createCompanyProfile(payload);

      setCompany(result.data);
      setMode("edit");
      setSuccessMessage(result.message);

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

  if (pageStatus === "loading") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading company profile...</p>
      </section>
    );
  }

  if (pageStatus === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="font-semibold text-red-700">
          Could not load company profile
        </p>

        <p className="mt-2 text-sm text-red-700">{apiError}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Company profile
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {mode === "edit"
              ? "Edit company profile"
              : "Create company profile"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Set up your company information so jobs, dashboards, and public
            listings show accurate details.
          </p>
        </div>

        <Link
          to="/company/dashboard"
          className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
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
        <h2 className="text-xl font-bold text-slate-950">Company logo</h2>

        <p className="mt-1 text-sm text-slate-600">
          Upload a JPG, PNG, or WebP logo. Maximum size is 2 MB.
        </p>

        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`${company.name} logo`}
            className="mt-5 h-24 w-24 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="mt-5 flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
            No logo
          </div>
        )}

        {mode === "edit" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label
                htmlFor="logo"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Logo file
              </label>

              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />

              {selectedLogo && (
                <p className="mt-2 text-sm text-slate-600">
                  Selected file:{" "}
                  <span className="font-medium text-slate-900">
                    {selectedLogo.name}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={isUploadingLogo || !selectedLogo}
              onClick={handleLogoUpload}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploadingLogo ? "Uploading..." : "Upload logo"}
            </button>
          </div>
        ) : (
          <p className="mt-5 text-sm text-amber-700">
            Create the company profile first, then upload the logo.
          </p>
        )}
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Company name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Example: HireFlow Technologies"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("name")}
            />

            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="industry"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Industry
              </label>

              <input
                id="industry"
                type="text"
                placeholder="Example: Software Development"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("industry")}
              />

              <FieldError message={errors.industry?.message} />
            </div>

            <div>
              <label
                htmlFor="companySize"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Company size
              </label>

              <select
                id="companySize"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                {...register("companySize")}
              >
                <option value="">Select company size</option>

                {COMPANY_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>

              <FieldError message={errors.companySize?.message} />
            </div>
          </div>

          <div>
            <label
              htmlFor="headquarters"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Headquarters
            </label>

            <input
              id="headquarters"
              type="text"
              placeholder="Example: Pune, Maharashtra"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("headquarters")}
            />

            <FieldError message={errors.headquarters?.message} />
          </div>

          <div>
            <label
              htmlFor="websiteUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Website URL
            </label>

            <input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("websiteUrl")}
            />

            <FieldError message={errors.websiteUrl?.message} />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              rows={6}
              placeholder="Write a short company description."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("description")}
            />

            <FieldError message={errors.description?.message} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/company/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update profile"
                : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfilePage;
