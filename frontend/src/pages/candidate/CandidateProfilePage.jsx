import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
} from "../../api/candidate.api";

import { candidateProfileSchema } from "../../features/candidates/candidate.schemas";

import { EXPERIENCE_LEVELS } from "../../features/candidates/candidate.constants";

import getApiError from "../../utils/getApiError";

import useAuth from "../../hooks/useAuth";

import Button from "../../components/ui/Button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

import ProfileAvatar from "../../components/common/ProfileAvatar";

import ProfilePhotoManager from "../../components/account/ProfilePhotoManager";

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

const ProfilePreviewCard = ({ values, completion, user, updateUser }) => {
  const fullName =
    [values.firstName, values.lastName].filter(Boolean).join(" ") ||
    "Your name";

  const skills = getSkillTags(values.skillsText);

  return (
    <aside className="grid gap-6">
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <ProfileAvatar user={user} name={fullName} size="lg" />

            <div
              className="grid h-20 w-20 place-items-center rounded-full text-sm font-black text-blue-700"
              style={{
                background: `conic-gradient(#2563eb ${
                  completion.percentage * 3.6
                }deg, #e2e8f0 0deg)`,
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
        </CardBody>

        <CardFooter>
          <Button
            as={Link}
            to="/candidate/dashboard"
            variant="secondary"
            fullWidth
          >
            Back to dashboard
          </Button>
        </CardFooter>
      </Card>

      <ProfilePhotoManager
        user={user}
        updateUser={updateUser}
        name={fullName}
        description="Upload a clear photo so recruiters can recognize your profile."
      />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Skills
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Recruiter keywords
          </h2>
        </CardHeader>

        <CardBody>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
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
            <p className="text-sm leading-6 text-slate-600">
              Add comma-separated skills like React, Node.js, MongoDB.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Profile tips
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Improve visibility
          </h2>
        </CardHeader>

        <CardBody>
          <div className="grid gap-3">
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
                GitHub, LinkedIn, and portfolio links make your profile
                stronger.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </aside>
  );
};

const CandidateProfilePage = () => {
  const navigate = useNavigate();

  const { user, updateUser } = useAuth();

  const [pageStatus, setPageStatus] = useState("loading");

  const [mode, setMode] = useState("create");

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = useWatch({ control }) ?? getDefaultValues();

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

    const payload = convertFormDataToPayload(formData);

    try {
      const result =
        mode === "edit"
          ? await updateCandidateProfile(payload)
          : await createCandidateProfile(payload);

      setMode("edit");
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
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading candidate profile...</p>
        </CardBody>
      </Card>
    );
  }

  if (pageStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load profile"
        description={apiError}
        action={
          <Button as={Link} to="/candidate/dashboard">
            Back to dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Candidate profile"
        title={mode === "edit" ? "Edit your profile" : "Create your profile"}
        description="Complete your profile so recruiters can understand your skills, experience, location, and links."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <ProfilePreviewCard
          values={watchedValues}
          completion={completion}
          user={user}
          updateUser={updateUser}
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
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Basic information
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Personal details
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                These details help companies identify and contact you.
              </p>
            </CardHeader>

            <CardBody>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="First name"
                  htmlFor="firstName"
                  error={errors.firstName?.message}
                >
                  <input
                    id="firstName"
                    type="text"
                    className={getInputClassName(Boolean(errors.firstName))}
                    {...register("firstName")}
                  />
                </FormField>

                <FormField
                  label="Last name"
                  htmlFor="lastName"
                  error={errors.lastName?.message}
                >
                  <input
                    id="lastName"
                    type="text"
                    className={getInputClassName(Boolean(errors.lastName))}
                    {...register("lastName")}
                  />
                </FormField>

                <FormField
                  label="Phone"
                  htmlFor="phone"
                  error={errors.phone?.message}
                  hint="Optional. Example: +91 98765 43210"
                >
                  <input
                    id="phone"
                    type="text"
                    placeholder="+91 98765 43210"
                    className={getInputClassName(Boolean(errors.phone))}
                    {...register("phone")}
                  />
                </FormField>

                <FormField
                  label="Location"
                  htmlFor="location"
                  error={errors.location?.message}
                  hint="Example: Pune, India"
                >
                  <input
                    id="location"
                    type="text"
                    placeholder="Example: Pune, India"
                    className={getInputClassName(Boolean(errors.location))}
                    {...register("location")}
                  />
                </FormField>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Professional profile
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Skills and experience
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                This section is used to understand your job fit.
              </p>
            </CardHeader>

            <CardBody>
              <div className="grid gap-5">
                <FormField
                  label="Headline"
                  htmlFor="headline"
                  error={errors.headline?.message}
                  hint="Example: MERN Stack Developer"
                >
                  <input
                    id="headline"
                    type="text"
                    placeholder="Example: MERN Stack Developer"
                    className={getInputClassName(Boolean(errors.headline))}
                    {...register("headline")}
                  />
                </FormField>

                <FormField
                  label="Experience level"
                  htmlFor="experienceLevel"
                  error={errors.experienceLevel?.message}
                >
                  <select
                    id="experienceLevel"
                    className={getInputClassName(
                      Boolean(errors.experienceLevel),
                    )}
                    {...register("experienceLevel")}
                  >
                    <option value="">Select experience level</option>

                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Skills"
                  htmlFor="skillsText"
                  error={errors.skillsText?.message}
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

                <FormField
                  label="Summary"
                  htmlFor="summary"
                  error={errors.summary?.message}
                  hint="Optional. Keep it short, practical, and recruiter-friendly."
                >
                  <textarea
                    id="summary"
                    rows={5}
                    placeholder="Write a short summary about your background, skills, projects, and career goals."
                    className={getTextareaClassName(Boolean(errors.summary))}
                    {...register("summary")}
                  />
                </FormField>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Social links
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Portfolio and profiles
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Add links that help recruiters verify your work.
              </p>
            </CardHeader>

            <CardBody>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="LinkedIn URL"
                  htmlFor="linkedinUrl"
                  error={errors.linkedinUrl?.message}
                  hint="Optional. Example: https://linkedin.com/in/username"
                >
                  <input
                    id="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    className={getInputClassName(Boolean(errors.linkedinUrl))}
                    {...register("linkedinUrl")}
                  />
                </FormField>

                <FormField
                  label="GitHub URL"
                  htmlFor="githubUrl"
                  error={errors.githubUrl?.message}
                  hint="Optional. Example: https://github.com/username"
                >
                  <input
                    id="githubUrl"
                    type="url"
                    placeholder="https://github.com/username"
                    className={getInputClassName(Boolean(errors.githubUrl))}
                    {...register("githubUrl")}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField
                    label="Portfolio URL"
                    htmlFor="portfolioUrl"
                    error={errors.portfolioUrl?.message}
                    hint="Optional. Example: https://yourportfolio.com"
                  >
                    <input
                      id="portfolioUrl"
                      type="url"
                      placeholder="https://yourportfolio.com"
                      className={getInputClassName(
                        Boolean(errors.portfolioUrl),
                      )}
                      {...register("portfolioUrl")}
                    />
                  </FormField>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="sticky bottom-2 z-20 bg-gray-200! backdrop-blur">
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {mode === "edit"
                  ? "Save changes to update your candidate profile."
                  : "Create your profile to start applying to jobs."}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button as={Link} to="/candidate/dashboard" variant="secondary">
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save profile"
                      : "Create profile"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CandidateProfilePage;
