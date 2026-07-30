import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  LoaderCircle,
  Search,
  Sparkles,
  Tags,
  TrendingUp,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import {
  generateCandidateResumeInsights,
  getCandidateResumeInsights,
} from "../../api/ai.api";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

import Button from "../ui/Button";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const INSIGHT_TONES = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-700",

    dot: "bg-emerald-500",
  },

  blue: {
    icon: "bg-blue-50 text-blue-700",

    dot: "bg-blue-500",
  },

  amber: {
    icon: "bg-amber-50 text-amber-700",

    dot: "bg-amber-500",
  },

  violet: {
    icon: "bg-violet-50 text-violet-700",

    dot: "bg-violet-500",
  },
};

const formatDateTime = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const normalizeItems = (items) => {
  return Array.isArray(items) ? items.filter(Boolean) : [];
};

const getScoreClasses = (score) => {
  if (score >= 80) {
    return ["border-emerald-200", "bg-emerald-50", "text-emerald-700"].join(
      " ",
    );
  }

  if (score >= 60) {
    return ["border-blue-200", "bg-blue-50", "text-blue-700"].join(" ");
  }

  if (score >= 40) {
    return ["border-amber-200", "bg-amber-50", "text-amber-700"].join(" ");
  }

  return ["border-red-200", "bg-red-50", "text-red-700"].join(" ");
};

const UsageStatus = ({ usage }) => {
  if (!usage) {
    return null;
  }

  const resetAt = formatDateTime(usage.resetAt);

  return (
    <p className="text-xs leading-5 text-slate-500">
      <span className="font-medium text-violet-700">
        {usage.remaining} of {usage.limit} AI uses remaining today
      </span>

      {resetAt && (
        <>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>

          <span>Resets {resetAt}</span>
        </>
      )}
    </p>
  );
};

const SkillChips = ({
  skills,
  emptyMessage = "No structured skills were extracted.",
  variant = "blue",
}) => {
  const values = normalizeItems(skills);

  if (values.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>;
  }

  const variantClasses =
    variant === "violet"
      ? ["border-violet-100", "bg-violet-50", "text-violet-700"].join(" ")
      : ["border-blue-100", "bg-blue-50", "text-blue-700"].join(" ");

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((skill) => (
        <span
          key={skill}
          className={[
            "inline-flex items-center",
            "rounded-full border",
            "px-2.5 py-1",
            "text-xs font-medium",
            variantClasses,
          ].join(" ")}
        >
          {skill}
        </span>
      ))}
    </div>
  );
};

const InsightSection = ({
  icon: Icon,
  title,
  items,
  emptyMessage,
  tone = "violet",
}) => {
  const values = normalizeItems(items);

  const toneClasses = INSIGHT_TONES[tone] || INSIGHT_TONES.violet;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={[
            "grid h-8 w-8",
            "shrink-0 place-items-center",
            "rounded-lg",
            toneClasses.icon,
          ].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      </div>

      {values.length > 0 ? (
        <ul className="mt-4 grid gap-2.5">
          {values.map((item, index) => (
            <li key={`${title}-${index}`} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={[
                  "mt-2 h-1.5 w-1.5",
                  "shrink-0 rounded-full",
                  toneClasses.dot,
                ].join(" ")}
              />

              <span className="text-sm leading-6 text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
};

const ProfileSuggestions = ({ updates }) => {
  if (!updates) {
    return null;
  }

  const skills = normalizeItems(updates.skills);

  const targetJobTitles = normalizeItems(updates.targetJobTitles);

  const hasUpdates = Boolean(
    updates.headline ||
    updates.summary ||
    skills.length > 0 ||
    targetJobTitles.length > 0,
  );

  if (!hasUpdates) {
    return null;
  }

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </div>

        <h4 className="text-sm font-semibold text-slate-950">
          Suggested profile updates
        </h4>
      </div>

      <div className="mt-4 grid gap-4">
        {updates.headline && (
          <div>
            <p className="text-xs font-medium text-slate-500">Headline</p>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-900">
              {updates.headline}
            </p>
          </div>
        )}

        {updates.summary && (
          <div>
            <p className="text-xs font-medium text-slate-500">Summary</p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {updates.summary}
            </p>
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500">
              Skills to consider adding
            </p>

            <SkillChips skills={skills} />
          </div>
        )}

        {targetJobTitles.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500">
              Suggested target roles
            </p>

            <SkillChips skills={targetJobTitles} variant="violet" />
          </div>
        )}
      </div>
    </section>
  );
};

const ResumeInsightsResult = ({ analysis }) => {
  const evaluation = analysis?.evaluation || {};

  const extracted = analysis?.extracted || {};

  const extractedSkills = [
    ...(extracted.skills || []),

    ...(extracted.programmingLanguages || []),

    ...(extracted.frameworks || []),

    ...(extracted.databases || []),

    ...(extracted.tools || []),
  ].filter((skill, index, values) => skill && values.indexOf(skill) === index);

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
            <Tags className="h-4 w-4" aria-hidden="true" />
          </div>

          <h4 className="text-sm font-semibold text-slate-950">
            Skills found in your resume
          </h4>
        </div>

        <SkillChips skills={extractedSkills} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightSection
          icon={CheckCircle2}
          title="Resume strengths"
          items={evaluation.strengths}
          emptyMessage="No specific strengths were returned."
          tone="emerald"
        />

        <InsightSection
          icon={TrendingUp}
          title="Improvements"
          items={evaluation.improvementSuggestions}
          emptyMessage="No improvement suggestions were returned."
          tone="blue"
        />

        <InsightSection
          icon={Search}
          title="Missing keywords"
          items={evaluation.missingKeywords}
          emptyMessage="No missing keywords were identified."
          tone="amber"
        />

        <InsightSection
          icon={FileText}
          title="ATS concerns"
          items={evaluation.atsIssues}
          emptyMessage="No ATS formatting concerns were identified."
          tone="violet"
        />
      </div>

      <ProfileSuggestions updates={evaluation.recommendedProfileUpdates} />
    </div>
  );
};

const ResumeInsightsToggle = ({ analysis, isOpen, onToggle }) => {
  const evaluation = analysis?.evaluation || {};

  const score =
    typeof evaluation.resumeScore === "number" ? evaluation.resumeScore : null;

  const analyzedAt = formatDateTime(analysis?.analyzedAt);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
          <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">
              Resume analysis ready
            </p>

            {score !== null && (
              <span
                className={[
                  "inline-flex",
                  "items-baseline gap-1",
                  "rounded-lg border",
                  "px-2 py-1",
                  "text-xs font-semibold",
                  getScoreClasses(score),
                ].join(" ")}
              >
                {score}

                <span className="text-[10px] font-medium opacity-75">/100</span>
              </span>
            )}
          </div>

          {analyzedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Generated {analyzedAt}
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        aria-expanded={isOpen}
        aria-controls="candidate-resume-insights-result"
        onClick={onToggle}
        className="w-full shrink-0 sm:w-auto"
      >
        {isOpen ? "Hide insights" : "View insights"}

        <ChevronDown
          aria-hidden="true"
          className={[
            "h-4 w-4",
            "transition-transform",
            "duration-200",

            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </Button>
    </div>
  );
};

const InsightsLoading = () => {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading AI Resume Insights</span>

      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg bg-violet-200/70" />

        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>

      <Skeleton className="h-14 w-full bg-violet-100/70" />
    </div>
  );
};

const CandidateResumeInsightsCard = ({ hasResume, resumeUrl }) => {
  const [pageStatus, setPageStatus] = useState("loading");

  const [analysis, setAnalysis] = useState(null);

  const [isFresh, setIsFresh] = useState(false);

  const [usage, setUsage] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const loadInsights = async () => {
      try {
        setPageStatus("loading");
        setErrorMessage("");

        /*
         * Cached results remain collapsed
         * during normal page visits and
         * when the resume changes.
         */
        setIsResultOpen(false);

        const result = await getCandidateResumeInsights();

        if (shouldIgnore) {
          return;
        }

        setAnalysis(result.data.analysis);

        setIsFresh(result.data.isFresh);

        setUsage(result.data.usage);

        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setPageStatus("error");
      }
    };

    loadInsights();

    return () => {
      shouldIgnore = true;
    };
  }, [resumeUrl, loadAttempt]);

  const handleRetry = () => {
    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const handleGenerateInsights = async () => {
    const hasUsageRemaining = !usage || usage.remaining > 0;

    if (!hasResume || !hasUsageRemaining || isGenerating) {
      return;
    }

    try {
      setIsGenerating(true);

      const result = await generateCandidateResumeInsights();

      setAnalysis(result.data.analysis);

      setIsFresh(true);

      setUsage(result.data.usage);

      setPageStatus("ready");
      setIsResultOpen(true);

      notify.success(result.message || "AI Resume Insights generated.");
    } catch (error) {
      const normalizedError = getApiError(error);

      if (normalizedError.statusCode === 429) {
        setUsage((currentUsage) => {
          if (!currentUsage) {
            return currentUsage;
          }

          return {
            ...currentUsage,
            remaining: 0,
          };
        });
      }

      notify.error("Could not generate resume insights", {
        description: normalizedError.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasUsageRemaining = !usage || usage.remaining > 0;

  const canGenerate = hasResume && hasUsageRemaining && !isGenerating;

  const hasCurrentAnalysis = Boolean(hasResume && analysis && isFresh);

  return (
    <section
      aria-busy={pageStatus === "loading" || isGenerating}
      className={[
        "overflow-hidden",
        "rounded-2xl border",
        "border-violet-200",
        "bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "border-b",
          "border-violet-100",
          "bg-linear-to-r",
          "from-violet-50/90",
          "via-white",
          "to-blue-50/70",
          "p-4 sm:p-5",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <span
              className={[
                "inline-flex",
                "items-center gap-1.5",
                "rounded-full",
                "border",
                "border-violet-100",
                "bg-white/80",
                "px-2.5 py-1",
                "text-xs font-medium",
                "text-violet-700",
              ].join(" ")}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI Resume Insights
            </span>

            <h2 className="mt-2.5 text-lg font-semibold text-slate-950">
              Improve your resume with AI
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Review extracted skills, strengths, missing keywords, and
              practical improvements.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {pageStatus === "loading" && <InsightsLoading />}

        {pageStatus === "error" && (
          <SectionError
            compact
            title="Could not load AI Resume Insights"
            message={errorMessage}
            onRetry={handleRetry}
          />
        )}

        {pageStatus === "ready" && !hasResume && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-950">
                Resume required
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Upload a PDF resume before generating insights.
              </p>
            </div>
          </div>
        )}

        {pageStatus === "ready" && hasResume && !hasCurrentAnalysis && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">
                {analysis
                  ? "Generate insights for your updated resume"
                  : "Generate your resume analysis"}
              </p>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                {analysis
                  ? "The resume file changed, so the previous analysis is no longer current."
                  : "Create a structured review using your submitted PDF."}
              </p>

              <div className="mt-2">
                <UsageStatus usage={usage} />
              </div>
            </div>

            <Button
              type="button"
              variant="ai"
              disabled={!canGenerate}
              onClick={handleGenerateInsights}
              className="w-full shrink-0 sm:w-auto"
            >
              {isGenerating ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : hasUsageRemaining ? (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              ) : (
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              )}

              {isGenerating
                ? "Generating..."
                : hasUsageRemaining
                  ? "Generate insights"
                  : "Daily limit reached"}
            </Button>
          </div>
        )}

        {pageStatus === "ready" && hasCurrentAnalysis && (
          <>
            <ResumeInsightsToggle
              analysis={analysis}
              isOpen={isResultOpen}
              onToggle={() => setIsResultOpen((currentValue) => !currentValue)}
            />

            <div
              id="candidate-resume-insights-result"
              className={[
                "grid overflow-hidden",
                "transition-[grid-template-rows,opacity]",
                "duration-300",
                "ease-in-out",

                isResultOpen
                  ? ["grid-rows-[1fr]", "opacity-100"].join(" ")
                  : ["grid-rows-[0fr]", "opacity-0"].join(" "),
              ].join(" ")}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-violet-100 pt-4 mt-4">
                  <ResumeInsightsResult analysis={analysis} />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <UsageStatus usage={usage} />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CandidateResumeInsightsCard;
