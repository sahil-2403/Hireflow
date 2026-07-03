import { useEffect, useMemo, useState } from "react";

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

const getProfileCompletion = (values) => {
  const checks = [
    Boolean(values.firstName?.trim()),
    Boolean(values.lastName?.trim()),
    Boolean(values.experienceLevel),
    Boolean(values.location?.trim()),
    Boolean(values.headline?.trim()),
    Boolean(values.skillsText?.trim()),
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
};

const getSkillTags = (skillsText) => {
  if (!skillsText) {
    return [];
  }

  return skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 10);
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const textareaClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const labelClassName = "mb-2 block text-sm font-bold text-slate-700";

const FormSectionHeader = ({ eyebrow, title, description }) => {
  return (
    <div className="border-b border-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      )}
    </div>
  );
};

const ProfilePreviewCard = ({ values, completion }) => {
  const fullName =
    [values.firstName, values.lastName].filter(Boolean).join(" ") ||
    "Your name";

  const skills = getSkillTags(values.skillsText);

  return (
    <aside className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-lg font-black text-white">
              {fullName[0].toUpperCase()}
            </div>

            <div
              className="grid h-20 w-20 place-items-center rounded-full text-sm font-black text-blue-700"
              style={{
                background: `conic-gradient(#2563eb ${completion.percentage * 3.6}deg, #e2e8f0 0deg)`,
              }}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
                {completion.percentage}%
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Profile preview
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {fullName}
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-600">
            {values.headline || "Add your professional headline"}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            {values.location || "Add your location"}
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${completion.percentage}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {completion.completed} of {completion.total} key sections completed
          </p>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 p-4">
          <Link
            to="/candidate/dashboard"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Skills
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Recruiter keywords
        </h2>

        {skills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add comma-separated skills like React, Node.js, MongoDB.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Profile tips
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Improve visibility
        </h2>

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">
              Add a clear headline
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Example: MERN Stack Developer with React and Node.js experience.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">
              Keep skills searchable
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Use simple keywords recruiters can filter by.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">
              Add portfolio links
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              GitHub, LinkedIn, and portfolio links make your profile stronger.
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = watch();

  const completion = useMemo(() => {
    return getProfileCompletion(watchedValues);
  }, [watchedValues]);

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
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Candidate profile
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {mode === "edit" ? "Edit your profile" : "Create your profile"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Complete your profile so recruiters can understand your skills,
              experience, and links.
            </p>
          </div>

          {/* <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Experience level
            </p>

            <p className="mt-1 text-sm font-black text-slate-950">
              {getExperienceLabel(watchedValues.experienceLevel)}
            </p>
          </div> */}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <ProfilePreviewCard values={watchedValues} completion={completion} />

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {apiError && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {apiError}
            </div>
          )}

          {successMessage && (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <FormSectionHeader
              eyebrow="Basic information"
              title="Personal details"
              description="These details help companies identify and contact you."
            />

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClassName}>
                  First name
                </label>

                <input
                  id="firstName"
                  type="text"
                  className={inputClassName}
                  {...register("firstName")}
                />

                <FieldError message={errors.firstName?.message} />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClassName}>
                  Last name
                </label>

                <input
                  id="lastName"
                  type="text"
                  className={inputClassName}
                  {...register("lastName")}
                />

                <FieldError message={errors.lastName?.message} />
              </div>

              <div>
                <label htmlFor="phone" className={labelClassName}>
                  Phone
                </label>

                <input
                  id="phone"
                  type="text"
                  placeholder="+91 98765 43210"
                  className={inputClassName}
                  {...register("phone")}
                />

                <FieldError message={errors.phone?.message} />
              </div>

              <div>
                <label htmlFor="location" className={labelClassName}>
                  Location
                </label>

                <input
                  id="location"
                  type="text"
                  placeholder="Example: Pune, India"
                  className={inputClassName}
                  {...register("location")}
                />

                <FieldError message={errors.location?.message} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <FormSectionHeader
              eyebrow="Professional profile"
              title="Skills and experience"
              description="This section is used to understand your job fit."
            />

            <div className="grid gap-5 p-5">
              <div>
                <label htmlFor="headline" className={labelClassName}>
                  Headline
                </label>

                <input
                  id="headline"
                  type="text"
                  placeholder="Example: MERN Stack Developer"
                  className={inputClassName}
                  {...register("headline")}
                />

                <FieldError message={errors.headline?.message} />
              </div>

              <div>
                <label htmlFor="experienceLevel" className={labelClassName}>
                  Experience level
                </label>

                <select
                  id="experienceLevel"
                  className={inputClassName}
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

              <div>
                <label htmlFor="skillsText" className={labelClassName}>
                  Skills
                </label>

                <input
                  id="skillsText"
                  type="text"
                  placeholder="React, Node.js, MongoDB"
                  className={inputClassName}
                  {...register("skillsText")}
                />

                <p className="mt-1 text-xs text-slate-500">
                  Separate skills with commas.
                </p>

                <FieldError message={errors.skillsText?.message} />
              </div>

              <div>
                <label htmlFor="summary" className={labelClassName}>
                  Summary
                </label>

                <textarea
                  id="summary"
                  rows={5}
                  placeholder="Write a short summary about your background, skills, projects, and career goals."
                  className={textareaClassName}
                  {...register("summary")}
                />

                <FieldError message={errors.summary?.message} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <FormSectionHeader
              eyebrow="Social links"
              title="Portfolio and profiles"
              description="Add links that help recruiters verify your work."
            />

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <label htmlFor="linkedinUrl" className={labelClassName}>
                  LinkedIn URL
                </label>

                <input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className={inputClassName}
                  {...register("linkedinUrl")}
                />

                <FieldError message={errors.linkedinUrl?.message} />
              </div>

              <div>
                <label htmlFor="githubUrl" className={labelClassName}>
                  GitHub URL
                </label>

                <input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username"
                  className={inputClassName}
                  {...register("githubUrl")}
                />

                <FieldError message={errors.githubUrl?.message} />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="portfolioUrl" className={labelClassName}>
                  Portfolio URL
                </label>

                <input
                  id="portfolioUrl"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  className={inputClassName}
                  {...register("portfolioUrl")}
                />

                <FieldError message={errors.portfolioUrl?.message} />
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {mode === "edit"
                ? "Save changes to update your candidate profile."
                : "Create your profile to start applying to jobs."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/candidate/dashboard"
                className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Saving..."
                  : mode === "edit"
                    ? "Save profile"
                    : "Create profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateProfilePage;
