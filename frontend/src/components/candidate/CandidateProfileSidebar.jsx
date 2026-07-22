import { MapPin, Sparkles, UserRound } from "lucide-react";

import ProfilePhotoManager from "../account/ProfilePhotoManager";

import ProfileAvatar from "../common/ProfileAvatar";

import { Card, CardBody } from "../ui/Card";

import Pill from "../ui/Pill";

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

const ProfileProgress = ({ percentage }) => {
  return (
    <div
      className={[
        "grid h-16 w-16",
        "shrink-0 place-items-center",
        "rounded-full",
        "text-xs font-semibold",
        "text-blue-700",
      ].join(" ")}
      style={{
        background: `conic-gradient(
          #2563eb ${percentage * 3.6}deg,
          #e2e8f0 0deg
        )`,
      }}
      aria-label={`${percentage}% profile complete`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-white">
        {percentage}%
      </div>
    </div>
  );
};

const CandidateProfileSidebar = ({
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

  const accuracyVariant =
    recommendationAccuracy.label === "Strong"
      ? "emerald"
      : recommendationAccuracy.label === "Good"
        ? "blue"
        : "slate";

  return (
    <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
      <Card>
        <CardBody className="p-5">
          <div className="flex min-w-0 items-start gap-3">
            <ProfileAvatar
              user={user}
              name={fullName}
              size="lg"
              fallbackClassName="bg-blue-50 text-blue-700"
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-5 text-blue-600">
                Live profile preview
              </p>

              <h2 className="wrap-break-word text-lg font-semibold leading-7 text-slate-950">
                {fullName}
              </h2>

              <p className="mt-0.5 wrap-break-word text-sm leading-5 text-slate-600">
                {values.headline || "Add your professional headline"}
              </p>
            </div>

            <ProfileProgress percentage={completion.percentage} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm leading-6 text-slate-500">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />

            <span className="wrap-break-word">
              {values.location || "Add your location"}
            </span>

            {values.experienceLevel && (
              <Pill variant="slate" size="xs">
                {values.experienceLevel}
              </Pill>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium leading-5 text-slate-500">
                Profile completion
              </p>

              <p className="text-xs font-medium leading-5 text-slate-600">
                {completion.completed} of {completion.total}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${completion.percentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium leading-5 text-slate-500">
                    Recommendation quality
                  </p>

                  <Pill
                    variant={accuracyVariant}
                    size="xs"
                    className="normal-case"
                  >
                    {recommendationAccuracy.label}
                  </Pill>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {recommendationAccuracy.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" aria-hidden="true" />

              <h3 className="text-sm font-semibold leading-5 text-slate-950">
                Recruiter keywords
              </h3>
            </div>

            {skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Pill key={skill} variant="blue" size="xs">
                    {skill}
                  </Pill>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Add searchable skills such as React, Node.js and MongoDB.
              </p>
            )}
          </div>

          <ProfilePhotoManager
            user={user}
            updateUser={updateUser}
            name={fullName}
            eyebrow="Profile photo"
            title="Update your photo"
            description="Upload a clear photo recruiters can recognise."
            compact
            embedded
          />
        </CardBody>
      </Card>
    </aside>
  );
};

export default CandidateProfileSidebar;
