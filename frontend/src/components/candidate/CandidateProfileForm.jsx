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

import { Card, CardBody } from "../ui/Card";

import SelectInput from "../ui/SelectInput";
import TextareaInput from "../ui/TextareaInput";
import TextInput from "../ui/TextInput";

const ProfileFormSection = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  showBorder = true,
}) => {
  return (
    <section
      className={[
        "p-5 sm:p-6",

        showBorder ? "border-t border-slate-100" : "",
      ].join(" ")}
    >
      <header className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium leading-5 text-blue-600">
            {eyebrow}
          </p>

          <h2 className="text-lg font-semibold leading-7 text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
      </header>

      <div className="mt-5">{children}</div>
    </section>
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

const CandidateProfileForm = ({ register, errors }) => {
  return (
    <Card>
      <CardBody className="p-0">
        <ProfileFormSection
          icon={UserRound}
          eyebrow="Basic information"
          title="Personal details"
          description="Information companies use to identify and contact you."
          showBorder={false}
        >
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
        </ProfileFormSection>

        <ProfileFormSection
          icon={BriefcaseBusiness}
          eyebrow="Professional profile"
          title="Skills and experience"
          description="These details contribute to job matching and recruiter searches."
        >
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

            <TextareaInput
              id="summary"
              label="Professional summary"
              rows={5}
              placeholder="Summarise your background, projects, strengths, and career goals."
              hint="Optional. Maximum 2000 characters."
              error={errors.summary?.message}
              {...register("summary")}
            />
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          icon={SlidersHorizontal}
          eyebrow="Job preferences"
          title="Roles you are looking for"
          description="Optional preferences help improve deterministic match scores and job recommendations."
        >
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

            <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-violet-700"
                aria-hidden="true"
              />

              <p className="text-xs leading-5 text-slate-600">
                Detailed preferences help improve Suggested Jobs and future
                profile-based match scores.
              </p>
            </div>
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          icon={Link2}
          eyebrow="Portfolio links"
          title="Professional profiles"
          description="Add public links that help recruiters review and verify your work."
        >
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="sm:col-span-2">
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
          </div>
        </ProfileFormSection>
      </CardBody>
    </Card>
  );
};

export default CandidateProfileForm;
