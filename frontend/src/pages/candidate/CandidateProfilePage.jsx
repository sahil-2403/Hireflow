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

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/candidates/candidate.constants";

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
import Alert from "../../components/ui/Alert";
import Pill from "../../components/ui/Pill";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";
import TextareaInput from "../../components/ui/TextareaInput";

import ProfileAvatar from "../../components/common/ProfileAvatar";

import ProfilePhotoManager from "../../components/account/ProfilePhotoManager";

const convertCommaSeparatedTextToArray = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

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
    targetJobTitlesText: Array.isArray(profile?.targetJobTitles)
      ? profile.targetJobTitles.join(", ")
      : "",
    preferredLocationsText: Array.isArray(profile?.preferredLocations)
      ? profile.preferredLocations.join(", ")
      : "",
    preferredWorkplaceTypes: Array.isArray(profile?.preferredWorkplaceTypes)
      ? profile.preferredWorkplaceTypes
      : [],
    preferredEmploymentTypes: Array.isArray(profile?.preferredEmploymentTypes)
      ? profile.preferredEmploymentTypes
      : [],
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
  };
};

const convertFormDataToPayload = (formData) => {
  const skills = convertCommaSeparatedTextToArray(formData.skillsText);
  const targetJobTitles = convertCommaSeparatedTextToArray(
    formData.targetJobTitlesText,
  );
  const preferredLocations = convertCommaSeparatedTextToArray(
    formData.preferredLocationsText,
  );

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone || null,
    headline: formData.headline || null,
    summary: formData.summary || null,
    skills,
    experienceLevel: formData.experienceLevel,
    location: formData.location,
    targetJobTitles,
    preferredLocations,
    preferredWorkplaceTypes: formData.preferredWorkplaceTypes ?? [],
    preferredEmploymentTypes: formData.preferredEmploymentTypes ?? [],
    linkedinUrl: formData.linkedinUrl || null,
    githubUrl: formData.githubUrl || null,
    portfolioUrl: formData.portfolioUrl || null,
  };
};

const getRecommendationAccuracy = (values) => {
  const completedPreferences = [
    Boolean(values.targetJobTitlesText?.trim()),
    Boolean(values.preferredLocationsText?.trim()),
    values.preferredWorkplaceTypes?.length > 0,
    values.preferredEmploymentTypes?.length > 0,
  ].filter(Boolean).length;

  if (completedPreferences >= 3) {
    return {
      label: "Strong",
      description:
        "Your preferences are detailed enough for more accurate job matches.",
    };
  }

  if (completedPreferences >= 1) {
    return {
      label: "Good",
      description:
        "Add more preferences to improve your future job recommendations.",
    };
  }

  return {
    label: "Basic",
    description:
      "Add job preferences to help HireFlow recommend better matching jobs.",
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

const CheckboxGroup = ({ options, register, name }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
        >
          <input
            type="checkbox"
            value={option.value}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            {...register(name)}
          />

          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
};

const ProfilePreviewCard = ({
  values,
  completion,
  recommendationAccuracy,
  user,
  updateUser,
}) => {
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
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Matching
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Recommendation accuracy
          </h2>
        </CardHeader>

        <CardBody>
          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="text-sm font-black text-emerald-700">
              {recommendationAccuracy.label} accuracy
            </p>

            <p className="mt-2 text-sm leading-6 text-emerald-800">
              {recommendationAccuracy.description}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Job preferences are optional, but completing them will help future
            match scores and recommendations become more accurate.
          </p>
        </CardBody>
      </Card>

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
                <Pill key={skill} variant="blue">
                  {skill}
                </Pill>
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

  const recommendationAccuracy = useMemo(() => {
    return getRecommendationAccuracy(watchedValues);
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
          recommendationAccuracy={recommendationAccuracy}
          user={user}
          updateUser={updateUser}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {apiError && <Alert variant="error">{apiError}</Alert>}

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
                <TextInput
                  id="firstName"
                  type="text"
                  label="First name"
                  error={errors.firstName?.message}
                  {...register("firstName")}
                />

                <TextInput
                  id="lastName"
                  type="text"
                  label="Last name"
                  error={errors.lastName?.message}
                  {...register("lastName")}
                />

                <TextInput
                  id="phone"
                  type="text"
                  label="Phone"
                  placeholder="+91 98765 43210"
                  hint="Optional. Example: +91 98765 43210"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <TextInput
                  id="location"
                  type="text"
                  label="Location"
                  placeholder="Example: Pune, India"
                  hint="Example: Pune, India"
                  error={errors.location?.message}
                  {...register("location")}
                />
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
                <TextInput
                  id="headline"
                  type="text"
                  label="Headline"
                  placeholder="Example: MERN Stack Developer"
                  hint="Example: MERN Stack Developer"
                  error={errors.headline?.message}
                  {...register("headline")}
                />

                <SelectInput
                  id="experienceLevel"
                  label="Experience level"
                  placeholder="Select experience level"
                  options={EXPERIENCE_LEVELS}
                  error={errors.experienceLevel?.message}
                  {...register("experienceLevel")}
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

                <TextareaInput
                  id="summary"
                  label="Summary"
                  rows={5}
                  placeholder="Write a short summary about your background, skills, projects, and career goals."
                  hint="Optional. Keep it short, practical, and recruiter-friendly."
                  error={errors.summary?.message}
                  {...register("summary")}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Job preferences
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Roles you are looking for
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                These optional details will help HireFlow recommend better jobs
                and calculate more accurate match scores.
              </p>
            </CardHeader>

            <CardBody>
              <div className="grid gap-5">
                <TextInput
                  id="targetJobTitlesText"
                  type="text"
                  label="Target job titles"
                  placeholder="Frontend Developer, MERN Stack Developer, React Developer"
                  hint="Optional. Separate titles with commas."
                  error={errors.targetJobTitlesText?.message}
                  {...register("targetJobTitlesText")}
                />

                <TextInput
                  id="preferredLocationsText"
                  type="text"
                  label="Preferred locations"
                  placeholder="Pune, Mumbai, Remote"
                  hint="Optional. Add cities or Remote, separated by commas."
                  error={errors.preferredLocationsText?.message}
                  {...register("preferredLocationsText")}
                />

                <FormField
                  label="Preferred workplace types"
                  htmlFor="preferredWorkplaceTypes"
                  error={errors.preferredWorkplaceTypes?.message}
                  hint="Optional. Choose all that apply."
                >
                  <CheckboxGroup
                    options={WORKPLACE_TYPES}
                    register={register}
                    name="preferredWorkplaceTypes"
                  />
                </FormField>

                <FormField
                  label="Preferred employment types"
                  htmlFor="preferredEmploymentTypes"
                  error={errors.preferredEmploymentTypes?.message}
                  hint="Optional. Choose all that apply."
                >
                  <CheckboxGroup
                    options={EMPLOYMENT_TYPES}
                    register={register}
                    name="preferredEmploymentTypes"
                  />
                </FormField>

                <Alert variant="warning">
                  Complete your job preferences to get more accurate future job
                  recommendations and match scores.
                </Alert>
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
                <TextInput
                  id="linkedinUrl"
                  type="url"
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/username"
                  hint="Optional. Example: https://linkedin.com/in/username"
                  error={errors.linkedinUrl?.message}
                  {...register("linkedinUrl")}
                />

                <TextInput
                  id="githubUrl"
                  type="url"
                  label="GitHub URL"
                  placeholder="https://github.com/username"
                  hint="Optional. Example: https://github.com/username"
                  error={errors.githubUrl?.message}
                  {...register("githubUrl")}
                />

                <div className="sm:col-span-2">
                  <TextInput
                    id="portfolioUrl"
                    type="url"
                    label="Portfolio URL"
                    placeholder="https://yourportfolio.com"
                    hint="Optional. Example: https://yourportfolio.com"
                    error={errors.portfolioUrl?.message}
                    {...register("portfolioUrl")}
                  />
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
