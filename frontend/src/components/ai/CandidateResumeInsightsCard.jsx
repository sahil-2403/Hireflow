import { useEffect, useState } from "react";

import {
  generateCandidateResumeInsights,
  getCandidateResumeInsights,
} from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const formatDate = (value) => {
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

const getScoreClasses = (score) => {
  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (score >= 60) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (score >= 40) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
};

const InsightList = ({
  title,
  items,
  emptyMessage,
  marker = "✓",
  markerClassName = "bg-violet-100 text-violet-700",
}) => {
  const values = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
      <h4 className="text-sm font-black text-slate-950">{title}</h4>

      {values.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 grid gap-2.5">
          {values.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-start gap-2.5">
              <span
                className={[
                  "mt-0.5 grid h-5 w-5 shrink-0",
                  "place-items-center rounded-full text-[10px] font-black",
                  markerClassName,
                ].join(" ")}
              >
                {marker}
              </span>

              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SkillCloud = ({ skills }) => {
  const values = Array.isArray(skills) ? skills : [];

  if (values.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        No structured skills were extracted.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((skill) => (
        <Pill key={skill} variant="blue">
          {skill}
        </Pill>
      ))}
    </div>
  );
};

const RecommendedProfileUpdates = ({ updates }) => {
  if (!updates) {
    return null;
  }

  const hasUpdates = Boolean(
    updates.headline ||
    updates.summary ||
    updates.skills?.length > 0 ||
    updates.targetJobTitles?.length > 0,
  );

  if (!hasUpdates) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-blue-700">
        Suggested profile updates
      </p>

      <div className="mt-3 grid gap-3">
        {updates.headline && (
          <div>
            <p className="text-xs font-bold text-slate-500">Headline</p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {updates.headline}
            </p>
          </div>
        )}

        {updates.summary && (
          <div>
            <p className="text-xs font-bold text-slate-500">Summary</p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {updates.summary}
            </p>
          </div>
        )}

        {updates.skills?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500">
              Skills to consider adding
            </p>

            <SkillCloud skills={updates.skills} />
          </div>
        )}

        {updates.targetJobTitles?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500">
              Suggested target roles
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {updates.targetJobTitles.map((title) => (
                <Pill key={title} variant="violet">
                  {title}
                </Pill>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResumeInsightsResult = ({ analysis }) => {
  const evaluation = analysis?.evaluation || {};
  const extracted = analysis?.extracted || {};

  const score =
    typeof evaluation.resumeScore === "number" ? evaluation.resumeScore : null;

  const analyzedAt = formatDate(analysis?.analyzedAt);

  const extractedSkills = [
    ...(extracted.skills || []),
    ...(extracted.programmingLanguages || []),
    ...(extracted.frameworks || []),
    ...(extracted.databases || []),
    ...(extracted.tools || []),
  ].filter((skill, index, values) => skill && values.indexOf(skill) === index);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="emerald">Analysis ready</Pill>

            {analyzedAt && (
              <span className="text-xs text-slate-500">
                Generated {analyzedAt}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-xl font-black text-slate-950">
            Your resume insights
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review the extracted skills, strengths, and practical improvements
            before applying to jobs.
          </p>
        </div>

        {score !== null && (
          <div
            className={[
              "grid h-24 w-24 shrink-0 place-items-center",
              "rounded-3xl border text-center",
              getScoreClasses(score),
            ].join(" ")}
          >
            <div>
              <p className="text-2xl font-black">{score}</p>

              <p className="text-[10px] font-black uppercase tracking-wider">
                Resume score
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
        <p className="text-sm font-black text-slate-950">
          Skills found in your resume
        </p>

        <SkillCloud skills={extractedSkills} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightList
          title="Resume strengths"
          items={evaluation.strengths}
          emptyMessage="No specific strengths were returned."
          marker="✓"
          markerClassName="bg-emerald-100 text-emerald-700"
        />

        <InsightList
          title="Improvement suggestions"
          items={evaluation.improvementSuggestions}
          emptyMessage="No improvement suggestions were returned."
          marker="↑"
          markerClassName="bg-blue-100 text-blue-700"
        />

        <InsightList
          title="Missing keywords"
          items={evaluation.missingKeywords}
          emptyMessage="No missing keywords were identified."
          marker="!"
          markerClassName="bg-amber-100 text-amber-700"
        />

        <InsightList
          title="ATS formatting concerns"
          items={evaluation.atsIssues}
          emptyMessage="No ATS concerns were identified."
          marker="!"
          markerClassName="bg-violet-100 text-violet-700"
        />
      </div>

      <RecommendedProfileUpdates
        updates={evaluation.recommendedProfileUpdates}
      />
    </div>
  );
};

const ResumeInsightsToggle = ({ analysis, isOpen, onToggle }) => {
  const analyzedAt = formatDate(analysis?.analyzedAt);

  return (
    <div
      className={[
        "rounded-2xl border border-violet-200",
        "bg-white/85 p-4 shadow-sm shadow-violet-100",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill variant="emerald">Analysis ready</Pill>

              {analyzedAt && (
                <span className="text-xs text-slate-500">
                  Generated {analyzedAt}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm font-black text-slate-950">
              Your AI resume analysis is available
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {isOpen
                ? "Hide the detailed analysis to keep this page compact."
                : "Open the analysis to review your skills, strengths, ATS concerns, and improvements."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="candidate-resume-insights-result"
          className="shrink-0 gap-2"
        >
          {isOpen ? "Hide full analysis" : "View full analysis"}

          <span
            aria-hidden="true"
            className={[
              "text-sm transition-transform duration-300",
              isOpen ? "rotate-180" : "",
            ].join(" ")}
          >
            ↓
          </span>
        </Button>
      </div>
    </div>
  );
};

const CandidateResumeInsightsCard = ({ hasResume, resumeUrl }) => {
  const [pageStatus, setPageStatus] = useState("loading");

  const [analysis, setAnalysis] = useState(null);

  const [isFresh, setIsFresh] = useState(false);

  const [usage, setUsage] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  useEffect(() => {
    let shouldIgnore = false;

    const loadInsights = async () => {
      try {
        setPageStatus("loading");
        setErrorMessage("");
        setSuccessMessage("");

        // Existing analysis stays collapsed on normal page visits
        // and whenever the resume file changes.
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
  }, [resumeUrl]);

  const handleGenerateInsights = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setIsGenerating(true);

      const result = await generateCandidateResumeInsights();

      setAnalysis(result.data.analysis);
      setIsFresh(true);
      setUsage(result.data.usage);
      setSuccessMessage(result.message);
      setPageStatus("ready");

      // Newly generated results open immediately.
      setIsResultOpen(true);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleResult = () => {
    setIsResultOpen((currentValue) => !currentValue);
  };

  const hasUsageRemaining = !usage || usage.remaining > 0;

  const canGenerate = hasResume && hasUsageRemaining && !isGenerating;

  return (
    <AiCard
      className={[
        "border-violet-300",
        "shadow-lg shadow-violet-200/50",
        "ring-1 ring-violet-100",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden",
          "border-b border-violet-200/80",
          "bg-white/10 p-5",
          "backdrop-blur-[1px]",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute -left-12 -top-16",
            "h-44 w-44 rounded-full",
            "bg-violet-400/25 blur-3xl",
          ].join(" ")}
        />

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute -right-10 -top-16",
            "h-44 w-44 rounded-full",
            "bg-blue-400/25 blur-3xl",
          ].join(" ")}
        />

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 top-0",
            " bg-linear-to-r",
            "from-violet-600 via-indigo-500 to-blue-600",
          ].join(" ")}
        />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <AiBadge className="border-violet-300 bg-white/70 shadow-sm">
              AI Resume Insights
            </AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Understand and improve your resume
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              AI extracts your resume information and highlights strengths,
              missing keywords, ATS concerns, and practical improvements.
            </p>
          </div>

          <div
            className={[
              "rounded-2xl border border-white/80",
              "bg-white/75 px-4 py-3",
              "shadow-sm shadow-violet-200/50",
              "backdrop-blur-sm",
            ].join(" ")}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current status
            </p>

            <p className="mt-1 text-sm font-black text-violet-700">
              {!hasResume
                ? "Resume required"
                : isFresh
                  ? "Insights ready"
                  : analysis
                    ? "Resume changed"
                    : "Not generated"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 bg-transparent p-5">
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {pageStatus === "loading" && (
          <div className="rounded-2xl border border-white/80 bg-white/70 p-5">
            <p className="text-sm font-bold text-slate-700">
              Loading AI Resume Insights...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Checking whether your current resume already has an analysis.
            </p>
          </div>
        )}

        {pageStatus === "error" && (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload insights
            </Button>
          </div>
        )}

        {pageStatus === "ready" && !hasResume && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
            <p className="font-black text-amber-900">
              Upload your resume first
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              AI Resume Insights needs the PDF resume uploaded from this page.
            </p>
          </div>
        )}

        {pageStatus === "ready" && hasResume && (!analysis || !isFresh) && (
          <div className="rounded-2xl border border-white/80 bg-white/75 p-5">
            <p className="font-black text-slate-950">
              {analysis
                ? "Generate insights for your updated resume"
                : "Your resume is ready for AI insights"}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {analysis
                ? "Your resume file has changed, so the previous analysis is no longer considered current."
                : "Generate a structured review of your resume, including strengths and improvement opportunities."}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AiUsageStatus usage={usage} />

              <Button
                type="button"
                variant="ai"
                disabled={!canGenerate}
                onClick={handleGenerateInsights}
              >
                {isGenerating
                  ? "Generating AI insights..."
                  : hasUsageRemaining
                    ? "Generate AI Resume Insights"
                    : "Daily AI limit reached"}
              </Button>
            </div>
          </div>
        )}

        {pageStatus === "ready" && hasResume && analysis && isFresh && (
          <>
            <ResumeInsightsToggle
              analysis={analysis}
              isOpen={isResultOpen}
              onToggle={handleToggleResult}
            />

            <div
              id="candidate-resume-insights-result"
              className={[
                "grid overflow-hidden",
                "transition-[grid-template-rows,opacity]",
                "duration-300 ease-in-out",
                isResultOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pt-1">
                  <ResumeInsightsResult analysis={analysis} />
                </div>
              </div>
            </div>

            <AiUsageStatus usage={usage} />
          </>
        )}
      </div>
    </AiCard>
  );
};

export default CandidateResumeInsightsCard;
