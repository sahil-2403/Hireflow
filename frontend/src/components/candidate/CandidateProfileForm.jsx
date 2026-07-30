import {
  BriefcaseBusiness,
  Link2,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/candidates/candidate.constants";

import { Card, CardBody, CardHeader } from "../ui/Card";

import Pill from "../ui/Pill";
import SelectInput from "../ui/SelectInput";
import TextareaInput from "../ui/TextareaInput";
import TextInput from "../ui/TextInput";

const ProfileCardHeader = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-7 text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

const CheckboxGroup = ({ label, hint, options, register, name, error }) => {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  return (
    <fieldset>
      <legend className="text-sm font-medium leading-6 text-slate-700">
        {label}
      </legend>

      {hint && (
        <p id={hintId} className="mt-1 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={[
                "flex min-h-11",
                "cursor-pointer",
                "items-center gap-3",
                "rounded-xl border",
                "border-slate-200",
                "bg-white px-3 py-2",
                "text-sm font-medium",
                "text-slate-700",
                "transition-colors",
                "hover:border-blue-200",
                "hover:bg-blue-50/50",
              ].join(" ")}
            >
              <input
                id={id}
                type="checkbox"
                value={option.value}
                aria-describedby={[hint ? hintId : "", error ? errorId : ""]
                  .filter(Boolean)
                  .join(" ")}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register(name)}
              />

              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-xs leading-5 text-red-600"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
};

const getSkillTags = (skillsText) => {
  if (!skillsText) {
    return [];
  }

  return skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 12);
};

const RecruiterKeywordsPreview = ({ skillsText }) => {
  const skills = getSkillTags(skillsText);

  return (
    <div className="h-full rounded-xl border border-violet-100 bg-violet-50/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-700" aria-hidden="true" />

        <p className="text-xs font-medium leading-5 text-slate-700">
          Recruiter keywords
        </p>

        <span className="text-[11px] leading-4 text-slate-500">
          Live preview
        </span>
      </div>

      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Pill
              key={`${skill}-${index}`}
              variant="violet"
              size="xs"
              className="normal-case"
            >
              {skill}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Add searchable skills such as React, Node.js, and MongoDB.
        </p>
      )}
    </div>
  );
};

const RecommendationQualityPanel = ({ recommendationAccuracy }) => {
  const isStrong = recommendationAccuracy.label === "Strong";

  const isGood = recommendationAccuracy.label === "Good";

  const variant = isStrong ? "emerald" : isGood ? "blue" : "slate";

  const panelClassName = isStrong
    ? "border-emerald-100 bg-emerald-50/60"
    : isGood
      ? "border-blue-100 bg-blue-50/60"
      : "border-slate-200 bg-slate-50/70";

  const iconClassName = isStrong
    ? "bg-emerald-100 text-emerald-700"
    : isGood
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-200 text-slate-700";

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-3",
        panelClassName,
      ].join(" ")}
    >
      <div
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          iconClassName,
        ].join(" ")}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium leading-5 text-slate-600">
            Recommendation quality
          </p>

          <Pill variant={variant} size="xs" className="normal-case">
            {recommendationAccuracy.label}
          </Pill>
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {recommendationAccuracy.description}
        </p>
      </div>
    </div>
  );
};

const CandidatePersonalDetailsCard = ({ register, errors }) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <ProfileCardHeader
          icon={UserRound}
          title="Personal details"
          description="Information companies use to identify and contact you."
        />
      </CardHeader>

      <CardBody className="flex-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            id="firstName"
            type="text"
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />

          <TextInput
            id="lastName"
            type="text"
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />

          <TextInput
            id="phone"
            type="tel"
            label="Phone"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            hint="Optional. Include your country code."
            error={errors.phone?.message}
            {...register("phone")}
          />

          <TextInput
            id="location"
            type="text"
            label="Current location"
            autoComplete="address-level2"
            placeholder="Pune, India"
            error={errors.location?.message}
            {...register("location")}
          />
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateSkillsExperienceCard = ({ register, errors, values }) => {
  return (
    <Card>
      <CardHeader>
        <ProfileCardHeader
          icon={BriefcaseBusiness}
          title="Skills and experience"
          description="These details contribute to job matching and recruiter searches."
        />
      </CardHeader>

      <CardBody>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <TextInput
              id="headline"
              type="text"
              label="Professional headline"
              placeholder="MERN Stack Developer"
              hint="Optional. Use a concise role-focused headline."
              error={errors.headline?.message}
              {...register("headline")}
            />

            <SelectInput
              id="experienceLevel"
              label="Experience level"
              placeholder="Select level"
              options={EXPERIENCE_LEVELS}
              error={errors.experienceLevel?.message}
              {...register("experienceLevel")}
            />
          </div>

          <TextInput
            id="skillsText"
            type="text"
            label="Skills"
            placeholder="React, Node.js, Express, MongoDB"
            hint="Separate searchable skills with commas."
            error={errors.skillsText?.message}
            {...register("skillsText")}
          />

          <RecruiterKeywordsPreview skillsText={values.skillsText} />

          <TextareaInput
            id="summary"
            label="Professional summary"
            rows={4}
            placeholder="Summarise your background, projects, strengths, and career goals."
            hint="Optional. Maximum 2000 characters."
            error={errors.summary?.message}
            {...register("summary")}
          />
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateJobPreferencesCard = ({
  register,
  errors,
  recommendationAccuracy,
}) => {
  return (
    <Card>
      <CardHeader>
        <ProfileCardHeader
          icon={SlidersHorizontal}
          title="Job preferences"
          description="Optional preferences improve deterministic match scores and future job recommendations."
        />
      </CardHeader>

      <CardBody>
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              id="targetJobTitlesText"
              type="text"
              label="Target job titles"
              placeholder="Frontend Developer, MERN Developer"
              hint="Separate multiple roles with commas."
              error={errors.targetJobTitlesText?.message}
              {...register("targetJobTitlesText")}
            />

            <TextInput
              id="preferredLocationsText"
              type="text"
              label="Preferred locations"
              placeholder="Pune, Mumbai, Remote"
              hint="Separate locations with commas."
              error={errors.preferredLocationsText?.message}
              {...register("preferredLocationsText")}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <CheckboxGroup
              label="Preferred workplace types"
              hint="Choose all that apply."
              options={WORKPLACE_TYPES}
              register={register}
              name="preferredWorkplaceTypes"
              error={errors.preferredWorkplaceTypes?.message}
            />

            <CheckboxGroup
              label="Preferred employment types"
              hint="Choose all that apply."
              options={EMPLOYMENT_TYPES}
              register={register}
              name="preferredEmploymentTypes"
              error={errors.preferredEmploymentTypes?.message}
            />
          </div>

          <RecommendationQualityPanel
            recommendationAccuracy={recommendationAccuracy}
          />
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateProfessionalProfilesCard = ({ register, errors }) => {
  return (
    <Card>
      <CardHeader>
        <ProfileCardHeader
          icon={Link2}
          title="Professional profiles"
          description="Add public links that help recruiters review and verify your work."
        />
      </CardHeader>

      <CardBody>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextInput
            id="linkedinUrl"
            type="url"
            label="LinkedIn URL"
            autoComplete="url"
            placeholder="https://linkedin.com/in/username"
            error={errors.linkedinUrl?.message}
            {...register("linkedinUrl")}
          />

          <TextInput
            id="githubUrl"
            type="url"
            label="GitHub URL"
            autoComplete="url"
            placeholder="https://github.com/username"
            error={errors.githubUrl?.message}
            {...register("githubUrl")}
          />

          <TextInput
            id="portfolioUrl"
            type="url"
            label="Portfolio URL"
            autoComplete="url"
            placeholder="https://yourportfolio.com"
            error={errors.portfolioUrl?.message}
            {...register("portfolioUrl")}
          />
        </div>
      </CardBody>
    </Card>
  );
};

export {
  CandidateJobPreferencesCard,
  CandidatePersonalDetailsCard,
  CandidateProfessionalProfilesCard,
  CandidateSkillsExperienceCard,
};
