import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import AiBadge from "../ai/AiBadge";
import AiCard from "../ai/AiCard";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

const HERO_AI_SIGNALS = [
  {
    icon: FileText,
    label: "Resume insights",
    value: "Skills and ATS review",
    description: "Understand strengths, keywords, and possible improvements.",
  },
  {
    icon: Search,
    label: "Suggested jobs",
    value: "Profile + resume signals",
    description:
      "Use stored resume insights to improve relevant job suggestions.",
  },
  {
    icon: FileSearch,
    label: "Match review",
    value: "Clear fit evidence",
    description: "Review why your resume may fit a particular role.",
  },
];

const CANDIDATE_AI_JOURNEY = [
  {
    icon: Upload,
    title: "Upload your resume",
    description: "Add the PDF you plan to use for job applications.",
  },
  {
    icon: Sparkles,
    title: "Generate Resume Insights",
    description:
      "Review extracted skills, strengths, missing keywords, ATS concerns, and profile suggestions.",
  },
  {
    icon: Search,
    title: "Discover stronger suggestions",
    description:
      "Suggested Jobs can combine your profile with stored resume information.",
  },
  {
    icon: FileSearch,
    title: "Review job fit",
    description:
      "Understand resume relevance and supporting match evidence before applying.",
  },
];

const CANDIDATE_AI_FEATURES = [
  {
    icon: FileText,
    title: "AI Resume Insights",
    description:
      "Review resume strengths, missing keywords, ATS concerns, and practical improvements.",
  },
  {
    icon: Search,
    title: "AI-enhanced Suggested Jobs",
    description:
      "Use your candidate profile and stored resume insights to improve relevant job suggestions.",
  },
  {
    icon: FileSearch,
    title: "Resume Fit and Match Review",
    description:
      "Understand how your resume fits a role and which evidence supports the match.",
  },
];

const COMPANY_AI_FEATURES = [
  {
    icon: BriefcaseBusiness,
    title: "AI Job Post Assistant",
    description:
      "Get structured assistance while preparing clearer and more complete job posts.",
  },
  {
    icon: UsersRound,
    title: "AI Suggested Shortlist",
    description:
      "Review a focused applicant group using available job-match and application information.",
  },
  {
    icon: MessageSquare,
    title: "AI Interview Kit",
    description:
      "Prepare role-specific interview questions and candidate evaluation areas.",
  },
  {
    icon: FileSearch,
    title: "AI Candidate Comparison",
    description:
      "Compare relevant candidate information in a structured format before deciding.",
  },
];

const COMPANY_AI_WORKFLOW = [
  {
    number: "01",
    icon: BriefcaseBusiness,
    title: "Prepare the job",
    feature: "AI Job Post Assistant",
    description:
      "Improve job-post structure, responsibilities, requirements, and clarity.",
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Review applicants",
    feature: "AI Suggested Shortlist",
    description:
      "Surface a focused group of applicants using available match and application data.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Prepare interviews",
    feature: "AI Interview Kit",
    description:
      "Generate role-specific questions and structured evaluation areas.",
  },
  {
    number: "04",
    icon: FileSearch,
    title: "Compare candidates",
    feature: "AI Candidate Comparison",
    description:
      "Review candidate information side by side before the hiring team decides.",
  },
];

const AiFeatureRow = ({ icon: Icon, title, description, tone = "blue" }) => {
  const iconClassName =
    tone === "violet"
      ? "bg-violet-50 text-violet-700"
      : "bg-blue-50 text-blue-700";

  return (
    <li className="flex min-w-0 items-start gap-3">
      <div
        className={[
          "grid h-9 w-9",
          "shrink-0 place-items-center",
          "rounded-xl",
          iconClassName,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold leading-5 text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </li>
  );
};

const AiAudienceCard = ({
  audience,
  icon: AudienceIcon,
  title,
  description,
  features,
  tone,
}) => {
  const isCompany = tone === "violet";

  return (
    <AiCard className="h-full">
      <div className="flex h-full min-w-0 flex-col p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
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
            <AudienceIcon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <AiBadge>{audience}</AiBadge>

            <h2 className="mt-3 text-xl font-semibold leading-7 tracking-tight text-slate-950">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-5">
          {features.map((feature) => (
            <AiFeatureRow key={feature.title} {...feature} tone={tone} />
          ))}
        </ul>
      </div>
    </AiCard>
  );
};

/*
 * Integrated into the job-search hero.
 * This replaces the disconnected AI notice
 * and its standalone Explore button.
 */
const HomeHeroAiDiscoveryPreview = () => {
  return (
    <section
      aria-labelledby="hero-ai-discovery-title"
      className={[
        "mt-5 overflow-hidden",
        "rounded-2xl",
        "border border-violet-100",
        "bg-white/75",
        "backdrop-blur",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="hero-ai-discovery-title"
              className="text-sm font-semibold leading-5 text-slate-950"
            >
              Improve job discovery with Resume Insights
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
              Build stronger candidate information before reviewing Suggested
              Jobs and resume-to-job fit.
            </p>
          </div>
        </div>

        <Link
          to="/register"
          className={[
            "inline-flex min-h-11",
            "w-fit items-center",
            "gap-1.5 rounded-lg",
            "px-2 py-2",
            "text-sm font-medium",
            "text-violet-700",
            "transition-colors",

            "hover:bg-violet-50",
            "hover:text-violet-800",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-violet-500",

            "sm:min-h-9",
          ].join(" ")}
        >
          Generate Resume Insights
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid divide-y divide-violet-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {HERO_AI_SIGNALS.map((signal) => {
          const SignalIcon = signal.icon;

          return (
            <article key={signal.label} className="min-w-0 p-4">
              <div className="flex items-center gap-2">
                <SignalIcon
                  className="h-4 w-4 shrink-0 text-violet-600"
                  aria-hidden="true"
                />

                <p className="text-xs font-medium text-violet-700">
                  {signal.label}
                </p>
              </div>

              <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">
                {signal.value}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {signal.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

/*
 * Decorative previews for the desktop
 * illustration inside the homepage hero.
 */
const HeroAiFloatingPreview = () => {
  return (
    <>
      <div className="absolute right-0 top-8 w-44 rotate-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-lg shadow-violet-100/60">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-700">
              Resume Insights
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-950">
              12 skills found
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-9 right-2 w-40 -rotate-2 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg shadow-blue-100/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-700">AI match</p>

            <p className="mt-1 text-xl font-semibold text-slate-950">86%</p>
          </div>

          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
};

const CandidateAiJourneySection = () => {
  return (
    <section aria-labelledby="candidate-ai-journey-title">
      <header className="mx-auto max-w-3xl text-center">
        <AiBadge>Candidate AI journey</AiBadge>

        <h2
          id="candidate-ai-journey-title"
          className="mt-3 text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9"
        >
          Move from resume upload to a clearer job decision
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Candidate AI tools form one connected workflow rather than separate,
          unrelated actions.
        </p>
      </header>

      <div
        className={[
          "relative mt-7",
          "overflow-hidden",
          "rounded-3xl",
          "border border-blue-100",
          "bg-linear-to-br",
          "from-blue-50/80",
          "via-white",
          "to-violet-50/70",
          "p-5",

          "sm:p-7",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className={[
            "absolute left-[12.5%]",
            "right-[12.5%] top-12",
            "hidden h-px",
            "bg-linear-to-r",
            "from-blue-300",
            "via-violet-300",
            "to-blue-300",

            "lg:block",
          ].join(" ")}
        />

        <ol className="relative grid gap-5 lg:grid-cols-4">
          {CANDIDATE_AI_JOURNEY.map((step, index) => {
            const StepIcon = step.icon;

            return (
              <li
                key={step.title}
                className={[
                  "relative flex",
                  "min-w-0 gap-3",

                  "before:absolute",
                  "before:-bottom-5",
                  "before:left-5",
                  "before:top-11",
                  "before:w-px",
                  "before:bg-blue-200",

                  index === CANDIDATE_AI_JOURNEY.length - 1
                    ? "before:hidden"
                    : "",

                  "lg:block",
                  "lg:text-center",
                  "lg:before:hidden",
                ].join(" ")}
              >
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm lg:mx-auto">
                  <StepIcon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="min-w-0 lg:mt-4">
                  <p className="text-xs font-medium text-blue-600">
                    Step {index + 1}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="relative mt-7 flex justify-center">
          <Button as={Link} to="/register">
            Build your candidate profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
};

const HomeAiFeaturesSection = () => {
  return (
    <section
      id="ai-features"
      className="scroll-mt-24"
      aria-labelledby="home-ai-features-title"
    >
      <header className="mx-auto max-w-3xl text-center">
        <AiBadge>HireFlow AI features</AiBadge>

        <h2
          id="home-ai-features-title"
          className="mt-3 text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9"
        >
          Focused AI assistance for both sides of the hiring process
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Candidates receive help with resume understanding and job matching,
          while hiring teams receive structured support for job posts,
          shortlisting, interviews, and comparisons.
        </p>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <AiAudienceCard
          audience="AI for candidates"
          icon={UserRound}
          title="Understand your resume and discover stronger matches"
          description="Use structured resume analysis and job-match information to prepare better applications."
          features={CANDIDATE_AI_FEATURES}
          tone="blue"
        />

        <AiAudienceCard
          audience="AI for hiring teams"
          icon={BriefcaseBusiness}
          title="Support hiring work without replacing human decisions"
          description="Use focused AI tools to prepare, review, and organise hiring information more efficiently."
          features={COMPANY_AI_FEATURES}
          tone="violet"
        />
      </div>
    </section>
  );
};

const CompanyAiWorkflowSection = () => {
  return (
    <section
      aria-labelledby="company-ai-workflow-title"
      className={[
        "overflow-hidden",
        "rounded-3xl",
        "border border-violet-100",
        "bg-linear-to-br",
        "from-violet-50/80",
        "via-white",
        "to-blue-50/70",
      ].join(" ")}
    >
      <div className="p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col items-center justify-between gap-5 lg:flex-row ">
          <header className="min-w-0">
            <AiBadge>Company AI workflow</AiBadge>

            <h2
              id="company-ai-workflow-title"
              className="mt-3 text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9"
            >
              AI assistance across the hiring workflow
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Move from job preparation to candidate comparison while keeping
              the final hiring decision with your team.
            </p>

            <Button
              as={Link}
              to="/register"
              variant="ai"
              className="mt-5 w-full sm:w-auto"
            >
              Create company-admin account
            </Button>
          </header>

          <ol className="grid gap-3">
            {COMPANY_AI_WORKFLOW.map((step) => {
              const StepIcon = step.icon;

              return (
                <li
                  key={step.number}
                  className="grid min-w-0 gap-3 items-start grid-cols-[auto_auto_minmax(0,0.8fr)] rounded-2xl border border-white/90 bg-white/75 p-4 backdrop-blur sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-start"
                >
                  <span className="p-2 text-xs font-semibold leading-5 text-violet-500">
                    {step.number}
                  </span>

                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <StepIcon className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-violet-700">
                      {step.title}
                    </p>

                    <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-950">
                      {step.feature}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="flex items-start gap-3 border-t border-violet-100 bg-white/55 px-5 py-4 sm:px-7 lg:px-8">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-950">
            Human decision remains essential
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Generated shortlists, interview kits, and comparisons support
            review; they do not make the final hiring decision.
          </p>
        </div>
      </div>
    </section>
  );
};

const AiTrustStrip = () => {
  return (
    <Card variant="subtle">
      <CardBody>
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                AI supports decisions. People make them.
              </h2>

              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
            </div>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
              HireFlow produces structured assistance using available resume,
              profile, job, and application information. Candidates and hiring
              teams should review generated results before applying or making
              hiring decisions.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export {
  AiTrustStrip,
  CandidateAiJourneySection,
  CompanyAiWorkflowSection,
  HeroAiFloatingPreview,
  HomeHeroAiDiscoveryPreview,
};

export default HomeAiFeaturesSection;
