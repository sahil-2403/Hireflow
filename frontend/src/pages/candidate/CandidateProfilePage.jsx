import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
} from "../../api/candidate.api";

import { candidateProfileSchema } from "../../features/candidates/candidate.schemas";

import { EXPERIENCE_LEVELS } from "../../features/candidates/candidate.constants";

import getApiError from "../../utils/getApiError";

import FieldError from "../../components/common/FieldError";

const getDefaultValues = (profile = null) => {
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    headline: profile?.headline ?? "",
    summary: profile?.summary ?? "",
    skillsText: Array.isArray(profile?.skills) ? profile.skills.join(", ") : "",
    experienceLevel: profile?.experienceLevel ?? "",
    location: profile?.location ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
  };
};

const convertFormDataToPayload = (formData) => {
  const skills = formData.skillsText
    ? formData.skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone || null,
    headline: formData.headline || null,
    summary: formData.summary || null,
    skills,
    experienceLevel: formData.experienceLevel,
    location: formData.location,
    linkedinUrl: formData.linkedinUrl || null,
    githubUrl: formData.githubUrl || null,
    portfolioUrl: formData.portfolioUrl || null,
  };
};

const CandidateProfilePage = () => {
  const navigate = useNavigate();

  const [pageStatus, setPageStatus] = useState("loading");

  const [mode, setMode] = useState("create");

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      try {
        const result = await getMyCandidateProfile();

        if (shouldIgnore) {
          return;
        }

        setMode("edit");
        reset(getDefaultValues(result.data));
        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (normalizedError.statusCode === 404) {
          setMode("create");
          reset(getDefaultValues());
          setPageStatus("ready");
          return;
        }

        setApiError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadProfile();

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
          ? await updateCandidateProfile(payload)
          : await createCandidateProfile(payload);

      setMode("edit");
      setSuccessMessage(result.message);

      reset(getDefaultValues(result.data));

      navigate("/candidate/dashboard", {
        replace: true,
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  if (pageStatus === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading candidate profile...</p>
      </div>
    );
  }

  if (pageStatus === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="font-semibold text-red-700">Could not load profile</p>

        <p className="mt-2 text-sm text-red-700">{apiError}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Candidate profile
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {mode === "edit" ? "Edit your profile" : "Create your profile"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Complete your profile so recruiters can understand your skills,
          experience, and job preferences.
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

        {successMessage && (
          <div
            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
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

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("phone")}
            />

            <FieldError message={errors.phone?.message} />
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

              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>

            <FieldError message={errors.experienceLevel?.message} />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="headline"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Headline
            </label>

            <input
              id="headline"
              type="text"
              placeholder="Example: MERN Stack Developer"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("headline")}
            />

            <FieldError message={errors.headline?.message} />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Location
            </label>

            <input
              id="location"
              type="text"
              placeholder="Example: Mumbai, India"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("location")}
            />

            <FieldError message={errors.location?.message} />
          </div>

          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <label
              htmlFor="summary"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Summary
            </label>

            <textarea
              id="summary"
              rows={5}
              placeholder="Write a short summary about your background, skills, and goals."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("summary")}
            />

            <FieldError message={errors.summary?.message} />
          </div>

          <div>
            <label
              htmlFor="linkedinUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              LinkedIn URL
            </label>

            <input
              id="linkedinUrl"
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("linkedinUrl")}
            />

            <FieldError message={errors.linkedinUrl?.message} />
          </div>

          <div>
            <label
              htmlFor="githubUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              GitHub URL
            </label>

            <input
              id="githubUrl"
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("githubUrl")}
            />

            <FieldError message={errors.githubUrl?.message} />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="portfolioUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Portfolio URL
            </label>

            <input
              id="portfolioUrl"
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("portfolioUrl")}
            />

            <FieldError message={errors.portfolioUrl?.message} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/candidate/dashboard"
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
              ? "Saving..."
              : mode === "edit"
                ? "Update profile"
                : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateProfilePage;
