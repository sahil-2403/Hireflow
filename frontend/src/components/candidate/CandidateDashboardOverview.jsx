import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  FileText,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";

import AiBadge from "../ai/AiBadge";
import AiCard from "../ai/AiCard";

import ProfileAvatar from "../common/ProfileAvatar";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

import Pill from "../ui/Pill";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const getProfileCompletion = (profile) => {
  if (!profile) {
    return {
      completed: 0,
      total: 6,
      percentage: 0,
    };
  }

  const checks = [
    Boolean(profile.firstName),
    Boolean(profile.lastName),
    Boolean(profile.experienceLevel),
    Boolean(profile.location),
    Boolean(profile.headline),

    Array.isArray(profile.skills) && profile.skills.length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  const total = checks.length;

  return {
    completed,
    total,

    percentage: Math.round((completed / total) * 100),
  };
};

const ReadinessSkeleton = () => {
  return (
    <Card className="min-h-full">
      <CardBody className="p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />

          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>

          <Skeleton className="h-12 w-12 rounded-full" />
        </div>

        <Skeleton className="mt-6 h-2 w-full rounded-full" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </CardBody>
    </Card>
  );
};

const ProfileProgress = ({ percentage }) => {
  return (
    <div
      className={[
        "grid h-14 w-14",
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
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white">
        {percentage}%
      </div>
    </div>
  );
};

const ReadinessStatusRow = ({
  icon: Icon,
  label,
  value,
  to,
  actionLabel,
  tone = "blue",
}) => {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",

    emerald: "bg-emerald-50 text-emerald-700",

    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div
        className={[
          "grid h-9 w-9",
          "shrink-0 place-items-center",
          "rounded-xl",

          toneClasses[tone] || toneClasses.blue,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>

        <p className="wrap-break-word text-sm font-semibold leading-5 text-slate-950">
          {value}
        </p>
      </div>

      <Link
        to={to}
        className={[
          "inline-flex min-h-9",
          "shrink-0 items-center",
          "gap-1 rounded-lg",
          "px-2 py-1.5",
          "text-xs font-medium",
          "text-blue-700",
          "transition-colors",

          "hover:bg-blue-50",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-blue-500",
        ].join(" ")}
      >
        {actionLabel}

        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
};

const CandidateReadinessCard = ({
  status,
  profile,
  errorMessage,
  user,
  onRetry,
}) => {
  if (status === "loading") {
    return <ReadinessSkeleton />;
  }

  if (status === "error") {
    return (
      <Card>
        <CardBody className="p-5">
          <SectionError
            compact
            title="Could not load profile"
            message={errorMessage}
            onRetry={onRetry}
          />
        </CardBody>
      </Card>
    );
  }

  if (status === "missing") {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardBody className="p-5">
          <div className="flex min-w-0 items-start gap-3">
            <ProfileAvatar
              user={user}
              size="md"
              fallbackClassName="bg-amber-100 text-amber-700"
            />

            <div className="min-w-0 flex-1">
              <Pill variant="amber" size="xs" className="normal-case">
                Profile required
              </Pill>

              <h2 className="mt-2 text-lg font-semibold leading-7 text-slate-950">
                Create your candidate profile
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Complete your profile before applying or receiving job
                recommendations.
              </p>
            </div>
          </div>

          <Button
            as={Link}
            to="/candidate/profile"
            className="mt-5 w-full sm:w-auto"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Create profile
          </Button>
        </CardBody>
      </Card>
    );
  }

  const completion = getProfileCompletion(profile);

  const hasResume = Boolean(profile?.resumeUrl);

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Candidate";

  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex min-w-0 items-start gap-3">
          <ProfileAvatar
            user={user}
            name={fullName}
            size="md"
            fallbackClassName="bg-blue-50 text-blue-700"
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-5 text-blue-600">
              Application readiness
            </p>

            <h2 className="wrap-break-word text-lg font-semibold leading-7 text-slate-950">
              {fullName}
            </h2>

            {profile?.headline && (
              <p className="mt-0.5 line-clamp-1 wrap-break-word text-sm leading-5 text-slate-500">
                {profile.headline}
              </p>
            )}
          </div>

          <ProfileProgress percentage={completion.percentage} />
        </div>

        <div className="mt-4">
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

        <div className="mt-4 grid gap-2">
          <ReadinessStatusRow
            icon={UserRound}
            label="Candidate profile"
            value={completion.percentage === 100 ? "Complete" : "In progress"}
            to="/candidate/profile"
            actionLabel="Edit"
          />

          <ReadinessStatusRow
            icon={FileText}
            label="Resume"
            value={hasResume ? "Uploaded" : "Not uploaded"}
            to="/candidate/resume"
            actionLabel={hasResume ? "Open" : "Upload"}
            tone={hasResume ? "emerald" : "amber"}
          />
        </div>
      </CardBody>
    </Card>
  );
};

const ApplicationsMetricCard = ({
  status,
  applicationsData,
  errorMessage,
  onRetry,
}) => {
  if (status === "loading") {
    return (
      <Card>
        <CardBody className="p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="mt-5 h-8 w-16" />
          <Skeleton className="mt-3 h-4 w-36" />
          <Skeleton className="mt-5 h-10 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardBody className="p-5">
          <SectionError
            compact
            title="Could not load applications"
            message={errorMessage}
            onRetry={onRetry}
          />
        </CardBody>
      </Card>
    );
  }

  const applications = applicationsData?.applications ?? [];

  const total = applicationsData?.pagination?.total ?? applications.length;

  const latestApplication = applications[0];

  return (
    <Card>
      <CardBody className="flex min-h-full flex-col p-5 justify-between">
        <div className="flex justify-between items-center">
          <div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
              Total applications
            </p>
          </div>

          <p className="text-4xl mr-3 font-semibold leading-10 text-slate-950">
            {total}
          </p>
        </div>

        {latestApplication ? (
          <div className="my-4 mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[0.7rem] font-medium leading-5 text-slate-500">
              Latest application
            </p>

            <div className="flex mt-2 gap-3">
              <p className="mt-1 wrap-break-word text-sm font-semibold leading-5 text-slate-950">
                {latestApplication.jobId?.title || "Job unavailable"}
              </p>

              <ApplicationStatusBadge status={latestApplication.status} />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your submitted applications will appear here.
          </p>
        )}

        <Button
          as={Link}
          to="/candidate/applications"
          variant="secondary"
          fullWidth
        >
          View applications
        </Button>
      </CardBody>
    </Card>
  );
};

const SuggestedJobsCard = ({ profileStatus, profile }) => {
  if (profileStatus === "loading") {
    return (
      <Card>
        <CardBody className="p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="mt-5 h-5 w-36" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-5 h-10 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  const hasProfile = profileStatus === "success";

  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <AiCard>
      <div className="sm:flex! sm:flex-col! p-5 sm:gap-13">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>

            <AiBadge>Recommendations</AiBadge>
          </div>

          <h2 className="mt-4 text-lg font-semibold leading-7 text-slate-950">
            {hasProfile
              ? "Discover relevant opportunities"
              : "Complete your profile first"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {hasProfile
              ? hasResume
                ? "Browse roles ranked using your profile, with stored resume signals available for stronger matching."
                : "Browse roles ranked using your skills, experience, preferences, and target roles."
              : "Profile information is required before job matches can be calculated."}
          </p>
        </div>

        <div className="">
          <Button
            as={Link}
            to={
              hasProfile
                ? "/jobs?recommended=true&sortBy=matchScore&order=desc"
                : "/candidate/profile"
            }
            variant={hasProfile ? "ai" : "secondary"}
            fullWidth
            className="mt-5"
          >
            {hasProfile ? "View matched roles" : "Create profile"}

            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </AiCard>
  );
};

const CandidateDashboardOverview = ({
  profileState,
  applicationsState,
  user,
  onRetryProfile,
  onRetryApplications,
}) => {
  return (
    <section
      aria-label="Candidate workspace overview"
      className={[
        "grid min-w-0 items-stretch",
        "items-start gap-5",

        "md:grid-cols-2",

        "xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)_minmax(260px,0.75fr)]",
      ].join(" ")}
    >
      <div className="md:col-span-2 xl:col-span-1">
        <CandidateReadinessCard
          status={profileState.status}
          profile={profileState.profile}
          errorMessage={profileState.errorMessage}
          user={user}
          onRetry={onRetryProfile}
        />
      </div>

      <ApplicationsMetricCard
        status={applicationsState.status}
        applicationsData={applicationsState.applicationsData}
        errorMessage={applicationsState.errorMessage}
        onRetry={onRetryApplications}
      />

      <SuggestedJobsCard
        profileStatus={profileState.status}
        profile={profileState.profile}
      />
    </section>
  );
};

const CandidateAiWorkspaceCard = ({ profileState }) => {
  const hasProfile = profileState.status === "success";

  const hasResume = Boolean(profileState.profile?.resumeUrl);

  const primaryAction = (() => {
    if (!hasProfile) {
      return {
        to: "/candidate/profile",
        label: "Create candidate profile",
      };
    }

    if (!hasResume) {
      return {
        to: "/candidate/resume",
        label: "Upload resume",
      };
    }

    return {
      to: "/candidate/resume",
      label: "Open Resume Insights",
    };
  })();

  const features = [
    {
      icon: FileText,
      title: "AI Resume Insights",
      description:
        "Review resume strengths, missing keywords, ATS concerns, and practical improvements.",
    },
    {
      icon: Sparkles,
      title: "AI-enhanced Suggested Jobs",
      description:
        "Use profile information and stored resume signals to improve relevant job suggestions.",
    },
    {
      icon: FileSearch,
      title: "Job-specific Resume Fit",
      description:
        "Review resume evidence and practical improvements for a particular job.",
    },
  ];

  return (
    <AiCard>
      <div className="grid min-w-0 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="min-w-0">
          <AiBadge>Candidate AI workspace</AiBadge>

          <h2 className="mt-3 text-xl font-semibold leading-7 tracking-tight text-slate-950">
            Prepare stronger job applications with focused AI assistance
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Resume analysis, Suggested Jobs, and job-specific fit reviews work
            together while deterministic matching remains the source of truth.
          </p>

          <div className="mt-5">
            <Button
              as={Link}
              to={primaryAction.to}
              variant="ai"
              className="w-full min-[420px]:w-auto"
            >
              {primaryAction.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          {features.map((feature) => {
            const FeatureIcon = feature.icon;

            return (
              <article
                key={feature.title}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-white/90 bg-white/70 p-3 backdrop-blur"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                  <FeatureIcon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-5 text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 border-t border-violet-100 bg-white/45 px-5 py-3 sm:px-6">
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          aria-hidden="true"
        />

        <p className="text-xs leading-5 text-slate-600">
          Review AI-generated information before changing your resume or
          deciding whether to apply.
        </p>
      </div>
    </AiCard>
  );
};

export { CandidateAiWorkspaceCard };

export default CandidateDashboardOverview;
