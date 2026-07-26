import { useEffect, useMemo, useState } from "react";

import { LoaderCircle, Save } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  createCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
} from "../../api/candidate.api";

import ProfileIdentityCard from "../../components/account/ProfileIdentityCard";

import {
  CandidateJobPreferencesCard,
  CandidatePersonalDetailsCard,
  CandidateProfessionalProfilesCard,
  CandidateSkillsExperienceCard,
} from "../../components/candidate/CandidateProfileForm";

import CandidateProfilePageSkeleton from "../../components/loading/CandidateProfilePageSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";

import { candidateProfileSchema } from "../../features/candidates/candidate.schemas";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

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
  return {
    firstName: formData.firstName,
    lastName: formData.lastName,

    phone: formData.phone || null,

    headline: formData.headline || null,

    summary: formData.summary || null,

    skills: convertCommaSeparatedTextToArray(formData.skillsText),

    experienceLevel: formData.experienceLevel,

    location: formData.location,

    targetJobTitles: convertCommaSeparatedTextToArray(
      formData.targetJobTitlesText,
    ),

    preferredLocations: convertCommaSeparatedTextToArray(
      formData.preferredLocationsText,
    ),

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

      description: "Your preferences provide detailed inputs for job matching.",
    };
  }

  if (completedPreferences >= 1) {
    return {
      label: "Good",

      description: "Add more preferences to strengthen future recommendations.",
    };
  }

  return {
    label: "Basic",

    description: "Add target roles and preferences to improve job matching.",
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

const CandidateProfilePage = () => {
  const navigate = useNavigate();

  const { user, updateUser } = useAuth();

  const [pageStatus, setPageStatus] = useState("loading");

  const [mode, setMode] = useState(null);

  const [apiError, setApiError] = useState("");

  const [loadAttempt, setLoadAttempt] = useState(0);

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

  const watchedValues =
    useWatch({
      control,
    }) || getDefaultValues();

  const completion = useMemo(
    () => getProfileCompletion(watchedValues),
    [watchedValues],
  );

  const recommendationAccuracy = useMemo(
    () => getRecommendationAccuracy(watchedValues),
    [watchedValues],
  );

  const fullName =
    [watchedValues.firstName, watchedValues.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    user?.email ||
    "Your profile";

  const profileDescription =
    [watchedValues.location, watchedValues.experienceLevel]
      .filter(Boolean)
      .join(" · ") || "Add your location and experience level";

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      setPageStatus("loading");
      setApiError("");

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
  }, [reset, loadAttempt]);

  const handleRetryLoad = () => {
    setApiError("");
    setPageStatus("loading");

    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

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

      notify.success(
        result.message ||
          (mode === "edit"
            ? "Candidate profile updated successfully."
            : "Candidate profile created successfully."),
      );

      navigate("/candidate/dashboard", {
        replace: true,
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  const pageTitle =
    mode === "edit"
      ? "Edit your profile"
      : mode === "create"
        ? "Create your profile"
        : "Your profile";

  const isLoading = pageStatus === "loading";

  const hasLoadError = pageStatus === "error";

  const isReady = pageStatus === "ready";

  return (
    <div className="grid gap-5">
      <PageHero
        title={pageTitle}
        description="Keep your personal information, professional experience, job preferences, and portfolio links current."
      />

      {isLoading && <CandidateProfilePageSkeleton />}

      {hasLoadError && (
        <SectionError
          title="Could not load profile"
          message={apiError}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
        >
          {apiError && <Alert variant="error">{apiError}</Alert>}

          <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-stretch">
            <ProfileIdentityCard
              user={user}
              updateUser={updateUser}
              name={fullName}
              subtitle={
                watchedValues.headline || "Add your professional headline"
              }
              description={profileDescription}
              completion={completion}
            />

            <CandidatePersonalDetailsCard register={register} errors={errors} />
          </div>

          <CandidateSkillsExperienceCard
            register={register}
            errors={errors}
            values={watchedValues}
          />

          <CandidateJobPreferencesCard
            register={register}
            errors={errors}
            recommendationAccuracy={recommendationAccuracy}
          />

          <CandidateProfessionalProfilesCard
            register={register}
            errors={errors}
          />

          <Card className="sticky bottom-3 z-20 border-slate-200 bg-white/90 shadow-lg shadow-slate-200/50 backdrop-blur">
            <CardBody className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <p className="text-sm leading-6 text-slate-600">
                {mode === "edit"
                  ? "Save your changes before leaving this page."
                  : "Create your profile to start applying and receiving job matches."}
              </p>

              <div className="grid gap-2 min-[420px]:grid-cols-2 sm:flex">
                <Button
                  as={Link}
                  to="/candidate/dashboard"
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden="true" />

                      {mode === "edit" ? "Save profile" : "Create profile"}
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

export default CandidateProfilePage;
