import { useEffect, useState } from "react";

import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileSearch,
  FileText,
  LayoutDashboard,
  MapPin,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";

import CompanyLogo from "../../components/common/CompanyLogo";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import Pill from "../../components/ui/Pill";
import SectionError from "../../components/ui/SectionError";
import Skeleton from "../../components/ui/Skeleton";

import { BASE_INPUT_CLASS_NAME } from "../../components/ui/TextInput";

import HomeAiFeaturesSection, {
  AiTrustStrip,
  CandidateAiJourneySection,
  CompanyAiWorkflowSection,
  HeroAiFloatingPreview,
  HomeHeroAiDiscoveryPreview,
} from "../../components/public/HomeAiFeaturesSection";

import getApiError from "../../utils/getApiError";
import formatJobMetadata from "../../utils/formatJobMetadata";

import { formatRelativePostedDate } from "../../utils/formatDate";

const QUICK_FILTERS = [
  {
    label: "Remote",
    to: "/jobs?workplaceType=remote",
  },
  {
    label: "Hybrid",
    to: "/jobs?workplaceType=hybrid",
  },
  {
    label: "Full time",
    to: "/jobs?employmentType=full-time",
  },
  {
    label: "Internship",
    to: "/jobs?employmentType=internship",
  },
];

const PRODUCT_CAPABILITIES = [
  {
    icon: FileSearch,
    title: "Search relevant jobs",
    description:
      "Browse roles using job, skill, location, and workplace filters.",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    icon: FileText,
    title: "Manage your resume",
    description: "Keep your resume ready and review structured AI insights.",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    icon: LayoutDashboard,
    title: "Track applications",
    description: "Follow application progress from one candidate workspace.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: UsersRound,
    title: "Manage hiring",
    description:
      "Publish jobs, review candidates, and collaborate with recruiters.",
    tone: "bg-amber-50 text-amber-700",
  },
];

const CANDIDATE_STEPS = [
  "Create and complete your candidate profile",
  "Upload your resume and discover relevant jobs",
  "Apply and track each application status",
];

const COMPANY_STEPS = [
  "Create your company profile and job posts",
  "Review applicants and compare job matches",
  "Manage recruiters and hiring stages",
];

const SectionHeading = ({ label, title, description, centered = false }) => {
  return (
    <header
      className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
    >
      {label && (
        <p className="text-xs font-medium leading-5 text-blue-600">{label}</p>
      )}

      <h2
        className={[
          "text-2xl font-semibold",
          "leading-8 tracking-tight",
          "text-slate-950",

          label ? "mt-1" : "",

          "sm:text-3xl",
          "sm:leading-9",
        ].join(" ")}
      >
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </header>
  );
};

const HeroPreview = () => {
  const jobs = [
    {
      title: "Frontend Developer",
      applications: 24,
      tone: "bg-blue-100 text-blue-700",
    },
    {
      title: "Product Designer",
      applications: 18,
      tone: "bg-violet-100 text-violet-700",
    },
    {
      title: "Backend Developer",
      applications: 31,
      tone: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div aria-hidden="true" className="relative hidden min-h-107.5 lg:block">
      <div className="absolute bottom-4 left-1/2 h-64 w-[92%] -translate-x-1/2 rounded-full bg-blue-200/45 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 w-[min(95%,560px)] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/85 shadow-xl shadow-blue-200/40 backdrop-blur-xl">
          <div className="flex h-10 items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />

            <span className="ml-3 h-2.5 w-28 rounded-full bg-slate-200" />
          </div>

          <div className="grid grid-cols-[110px_1fr]">
            <aside className="border-r border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-[10px] font-semibold text-white">
                  H
                </div>

                <div className="h-2.5 w-12 rounded-full bg-slate-700" />
              </div>

              <div className="mt-6 grid gap-4">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <div
                    key={index}
                    className={[
                      "h-2.5 rounded-full",

                      index === 0 ? "w-full bg-blue-200" : "w-4/5 bg-slate-200",
                    ].join(" ")}
                  />
                ))}
              </div>
            </aside>

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="h-4 w-40 rounded-full bg-slate-800" />

                  <div className="mt-2 h-2.5 w-56 rounded-full bg-slate-200" />
                </div>

                <div className="h-9 w-24 rounded-lg bg-blue-600" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Open jobs",
                    value: "12",
                    tone: "bg-blue-50",
                  },
                  {
                    label: "Applications",
                    value: "73",
                    tone: "bg-violet-50",
                  },
                  {
                    label: "Hired",
                    value: "8",
                    tone: "bg-emerald-50",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={[
                      "rounded-xl",
                      "border border-slate-100",
                      "p-3",
                      metric.tone,
                    ].join(" ")}
                  >
                    <div className="h-2 w-14 rounded-full bg-slate-300" />

                    <div className="mt-3 text-lg font-semibold text-slate-800">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-2.5">
                {jobs.map((job) => (
                  <div
                    key={job.title}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "grid h-9 w-9",
                          "shrink-0 place-items-center",
                          "rounded-lg",
                          job.tone,
                        ].join(" ")}
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="h-2.5 w-28 rounded-full bg-slate-700" />

                        <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
                      </div>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {job.applications}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-12 w-48 -rotate-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-lg shadow-blue-100/60">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex items-center ">
            <p className="font-bold text-xs tracking-tight">
              Recommended jobs by AI
            </p>
          </div>

          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        </div>
      </div>

      <HeroAiFloatingPreview />
    </div>
  );
};

const CapabilityCard = ({ icon: Icon, title, description, tone }) => {
  return (
    <Card variant="flat">
      <CardBody>
        <div
          className={[
            "grid h-10 w-10",
            "place-items-center",
            "rounded-xl",
            tone,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <h3 className="mt-4 text-base font-semibold leading-6 text-slate-950">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
      </CardBody>
    </Card>
  );
};

const AudienceCard = ({
  icon: Icon,
  title,
  description,
  steps,
  actionLabel,
  tone = "blue",
}) => {
  const isCompany = tone === "violet";

  return (
    <Card>
      <CardBody className="h-full">
        <div className="flex items-start gap-3">
          <div
            className={[
              "grid h-11 w-11",
              "shrink-0 place-items-center",
              "rounded-xl",

              isCompany
                ? "bg-violet-50 text-violet-700"
                : "bg-blue-50 text-blue-700",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-7 text-slate-950">
              {title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <ol className="mt-5 grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span
                className={[
                  "grid h-7 w-7",
                  "shrink-0 place-items-center",
                  "rounded-full",
                  "text-xs font-semibold",

                  isCompany
                    ? "bg-violet-50 text-violet-700"
                    : "bg-blue-50 text-blue-700",
                ].join(" ")}
              >
                {index + 1}
              </span>

              <span className="pt-0.5 text-sm leading-6 text-slate-700">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <Button
          as={Link}
          to="/register"
          variant={isCompany ? "secondary" : "primary"}
          fullWidth
          className="mt-6"
        >
          {actionLabel}

          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardBody>
    </Card>
  );
};

const LatestJobSkeleton = () => {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        </div>

        <Skeleton className="mt-5 h-4 w-64 max-w-full" />

        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardBody>
    </Card>
  );
};

const LatestJobCard = ({ job }) => {
  const jobId = job._id || job.id;

  const companyName = job.companyId?.name || "Company unavailable";

  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : [];

  return (
    <Card as="article" variant="interactive" className="h-full">
      <CardBody className="flex h-full flex-col">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo company={job.companyId} name={companyName} size="md" />

          <div className="min-w-0">
            <h3 className="wrap-break-word text-base font-semibold leading-6 text-slate-950">
              {job.title}
            </h3>

            <p className="mt-0.5 wrap-break-word text-sm leading-5 text-slate-500">
              {companyName}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs leading-5 text-slate-500">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />

              {job.location}
            </span>
          )}

          {job.employmentType && (
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
              {formatJobMetadata(job.employmentType)}
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Pill key={skill} variant="blue" size="xs">
                {skill}
              </Pill>
            ))}

            {job.skills.length > skills.length && (
              <Pill size="xs">+{job.skills.length - skills.length}</Pill>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-xs leading-5 text-slate-500">
            {formatRelativePostedDate(job.createdAt)}
          </p>

          <Button as={Link} to={`/jobs/${jobId}`} variant="secondary" size="xs">
            View job
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

const LatestJobsSection = () => {
  const [status, setStatus] = useState("loading");

  const [jobs, setJobs] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchLatestJobs = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const result = await listPublicJobs({
          page: 1,
          limit: 3,
          sortBy: "createdAt",
          order: "desc",
        });

        if (shouldIgnore) {
          return;
        }

        setJobs(result.data?.jobs ?? []);

        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setJobs([]);

        setErrorMessage(normalizedError.message);

        setStatus("error");
      }
    };

    fetchLatestJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [loadAttempt]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          label="Latest opportunities"
          title="Recently published jobs"
          description="Explore the latest open roles published by companies using HireFlow."
        />

        <Button
          as={Link}
          to="/jobs"
          variant="secondary"
          className="w-full sm:w-auto"
        >
          Browse all jobs
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {status === "loading" && (
        <div
          aria-busy="true"
          aria-live="polite"
          className="mt-6 grid gap-4 lg:grid-cols-3"
        >
          <span className="sr-only">Loading latest jobs</span>

          {Array.from({
            length: 3,
          }).map((_, index) => (
            <LatestJobSkeleton key={index} />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mt-6">
          <SectionError
            title="Could not load latest jobs"
            message={errorMessage}
            onRetry={() =>
              setLoadAttempt((currentAttempt) => currentAttempt + 1)
            }
          />
        </div>
      )}

      {status === "success" && jobs.length === 0 && (
        <div className="mt-6">
          <EmptyState
            size="compact"
            icon={BriefcaseBusiness}
            title="No open jobs yet"
            description="New opportunities will appear here when companies publish jobs."
            action={
              <Button as={Link} to="/jobs" variant="secondary">
                Open jobs page
              </Button>
            }
          />
        </div>
      )}

      {status === "success" && jobs.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {jobs.map((job) => (
            <LatestJobCard key={job._id || job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");

  const [location, setLocation] = useState("");

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("search", keyword.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    const queryString = params.toString();

    navigate(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <div className="grid pb-5 gap-10 sm:gap-25">
      <section
        className={["relative isolate", "overflow-hidden", "px-5", "mt-8"].join(" ")}
      >
        <div className="relative grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.7fr)] lg:items-start">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-white/75 px-2.5 py-1 text-xs font-medium text-blue-700 backdrop-blur">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Jobs, hiring, and focused AI assistance
            </span>

            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Find the right opportunity or build the right team.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Search jobs, manage applications, review candidates, and use
              focused AI tools for resume insights, job matching, and hiring
              support.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className={[
                "mt-6 grid gap-3",
                "rounded-2xl",
                "border border-white/90",
                "bg-white/80 p-3",
                "shadow-sm",
                "backdrop-blur",

                "sm:grid-cols-2",

                "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_auto]",
              ].join(" ")}
            >
              <div className="relative min-w-0">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <label htmlFor="home-keyword" className="sr-only">
                  Job title, keyword, or skill
                </label>

                <input
                  id="home-keyword"
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, keyword, or skill"
                  className={[BASE_INPUT_CLASS_NAME, "pl-10"].join(" ")}
                />
              </div>

              <div className="relative min-w-0">
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <label htmlFor="home-location" className="sr-only">
                  Location
                </label>

                <input
                  id="home-location"
                  type="search"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location or Remote"
                  className={[BASE_INPUT_CLASS_NAME, "pl-10"].join(" ")}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
              >
                Search jobs
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-slate-500">
                Popular:
              </span>

              {QUICK_FILTERS.map((filter) => (
                <Link
                  key={filter.label}
                  to={filter.to}
                  className={[
                    "inline-flex min-h-11",
                    "items-center",
                    "rounded-full",
                    "border",
                    "border-blue-100",
                    "bg-white/70",
                    "px-3 py-2",
                    "text-xs font-medium",
                    "text-blue-700",
                    "transition-colors",
                    "backdrop-blur",

                    "hover:bg-blue-50",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",

                    "sm:min-h-9",
                    "sm:py-1.5",
                  ].join(" ")}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button as={Link} to="/jobs">
                Browse all jobs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>

              <Button as={Link} to="/register" variant="secondary">
                Create account
              </Button>
            </div>
          </div>

          <div>
            <HeroPreview />
          </div>
        </div>
      </section>

      <HomeHeroAiDiscoveryPreview />

      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_CAPABILITIES.map((capability) => (
            <CapabilityCard key={capability.title} {...capability} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          label="Role-based workflows"
          title="One platform with focused workspaces"
          description="Candidates and hiring teams use different tools while staying connected through the same application workflow."
          centered
        />

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <AudienceCard
            icon={UserRound}
            title="For candidates"
            description="Find opportunities, manage your resume, and follow every application."
            steps={CANDIDATE_STEPS}
            actionLabel="Create candidate account"
          />

          <AudienceCard
            icon={Building2}
            title="For company admins"
            description="Create your hiring workspace and manage jobs, candidates, and recruiters."
            steps={COMPANY_STEPS}
            actionLabel="Create company-admin account"
            tone="violet"
          />
        </div>
      </section>

      <CandidateAiJourneySection />

      <HomeAiFeaturesSection />

      <CompanyAiWorkflowSection />

      <LatestJobsSection />

      <AiTrustStrip />

      <section
        className={[
          "relative overflow-hidden",
          "rounded-3xl",
          "border border-blue-100",
          "bg-linear-to-r",
          "from-blue-50",
          "via-white",
          "to-violet-50",
          "p-5",

          "sm:p-7",
          "lg:p-8",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-200/30 blur-3xl"
        />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-blue-700">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />

              <p className="text-sm font-medium">Start with HireFlow</p>
            </div>

            <h2 className="mt-2 text-2xl font-semibold leading-8 tracking-tight text-slate-950">
              Ready to move your job search or hiring process forward?
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Browse open opportunities or create the workspace that fits your
              role.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-[420px]:flex-row">
            <Button as={Link} to="/jobs">
              Browse jobs
            </Button>

            <Button as={Link} to="/register" variant="secondary">
              Create account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
