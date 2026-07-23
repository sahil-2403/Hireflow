import { useEffect, useMemo, useState } from "react";

import { createPortal } from "react-dom";

import { Link } from "react-router-dom";

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  LoaderCircle,
  Scale,
  X,
} from "lucide-react";

import { generateCandidateComparison } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const normalizeItems = (items) => {
  return Array.isArray(items) ? items.filter(Boolean) : [];
};

const InformationList = ({
  title,
  items,
  emptyMessage,
  variant = "strength",
}) => {
  const normalizedItems = normalizeItems(items);

  const markerConfig = {
    strength: {
      icon: Check,

      className: "bg-emerald-100 text-emerald-700",
    },

    difference: {
      icon: Scale,

      className: "bg-blue-100 text-blue-700",
    },

    verify: {
      icon: CircleHelp,

      className: "bg-amber-100 text-amber-700",
    },
  };

  const config = markerConfig[variant] || markerConfig.strength;

  const MarkerIcon = config.icon;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium leading-5 text-slate-600">{title}</p>

      {normalizedItems.length > 0 ? (
        <ul className="mt-3 grid gap-2.5">
          {normalizedItems.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="flex gap-2.5 text-sm leading-6 text-slate-700"
            >
              <span
                className={[
                  "mt-0.5 grid h-5 w-5",
                  "shrink-0",
                  "place-items-center",
                  "rounded-full",

                  config.className,
                ].join(" ")}
              >
                <MarkerIcon className="h-3 w-3" aria-hidden="true" />
              </span>

              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
};

const SkillList = ({ title, skills, variant, emptyMessage }) => {
  const normalizedSkills = normalizeItems(skills);

  return (
    <div>
      <p className="text-xs font-medium leading-5 text-slate-500">{title}</p>

      {normalizedSkills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedSkills.map((skill) => (
            <Pill
              key={`${title}-${skill}`}
              variant={variant}
              size="xs"
              className="normal-case"
            >
              {skill}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
};

const ComparedCandidateCard = ({ candidate, jobId }) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="wrap-break-word text-base font-semibold leading-6 text-slate-950">
              {candidate.candidateName || "Candidate"}
            </h3>

            <ApplicationStatusBadge status={candidate.applicationStatus} />
          </div>

          {candidate.headline && (
            <p className="mt-2 wrap-break-word text-sm font-medium leading-6 text-slate-700">
              {candidate.headline}
            </p>
          )}

          {candidate.confidenceLevel && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Match confidence: {candidate.confidenceLevel}
            </p>
          )}
        </div>

        <MatchScoreBadge
          size="sm"
          match={{
            matchScore: candidate.matchScore,

            matchLabel: candidate.matchLabel,
          }}
        />
      </div>

      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <p className="text-xs font-medium leading-5 text-violet-700">
          Comparison summary
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {candidate.summary || "No candidate summary was returned."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <InformationList
          title="Strongest evidence"
          items={candidate.strongestEvidence}
          emptyMessage="No specific evidence was returned."
          variant="strength"
        />

        <InformationList
          title="Concerns to verify"
          items={candidate.concernsToVerify}
          emptyMessage="No specific concerns were returned."
          variant="verify"
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4 lg:grid-cols-2">
        <SkillList
          title="Matched skills"
          skills={candidate.matchedSkills}
          variant="green"
          emptyMessage="No matched skills listed."
        />

        <SkillList
          title="Skills to verify"
          skills={candidate.missingSkills}
          variant="amber"
          emptyMessage="No missing skills listed."
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          as={Link}
          to={`/company/applications/${jobId}/${candidate.applicationId}`}
          size="sm"
          variant="secondary"
        >
          Review application
        </Button>
      </div>
    </article>
  );
};

const getInitials = (name) => {
  return String(name || "Candidate")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const CompanyCandidateComparisonCard = ({
  jobId,
  availability,
  selectedApplications,
  isResultVisible = false,
  resultsContainerId,
  onResultVisibilityChange,
  onRemoveSelected,
  onClearSelected,
}) => {
  const [comparison, setComparison] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setComparison(availability?.comparison || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);

    setErrorMessage("");
    setSuccessMessage("");
  }, [jobId, availability]);

  const minimumCandidates = Number(availability?.minimumCandidates) || 2;

  const maximumCandidates = Number(availability?.maximumCandidates) || 0;

  const eligibleApplicationCount =
    Number(availability?.eligibleApplicationCount) || 0;

  const selectedIds = useMemo(
    () =>
      normalizeItems(selectedApplications)
        .map((application) => application.applicationId)
        .filter(Boolean)
        .sort(),
    [selectedApplications],
  );

  const comparisonIds = useMemo(
    () =>
      normalizeItems(comparison?.candidates)
        .map((candidate) => candidate.applicationId)
        .filter(Boolean)
        .sort(),
    [comparison],
  );

  const selectionMatchesComparison = Boolean(
    comparison &&
    selectedIds.length === comparisonIds.length &&
    selectedIds.length > 0 &&
    selectedIds.every(
      (applicationId, index) => applicationId === comparisonIds[index],
    ),
  );

  const blockReason = runtimeBlockReason || availability?.blockReason || null;

  const insufficientCandidates = blockReason === "insufficient_candidates";

  const featureUnavailable = blockReason === "feature_unavailable";

  const dailyLimitReached =
    blockReason === "daily_limit" || Boolean(usage && usage.remaining <= 0);

  const hasMinimumSelection = selectedIds.length >= minimumCandidates;

  const isWithinMaximum =
    maximumCandidates >= minimumCandidates &&
    selectedIds.length <= maximumCandidates;

  const canGenerate =
    availability?.canGenerate === true &&
    hasMinimumSelection &&
    isWithinMaximum &&
    !selectionMatchesComparison &&
    !blockReason &&
    !isGenerating;

  const handleGenerate = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      hasMinimumSelection &&
      isWithinMaximum &&
      !selectionMatchesComparison &&
      !blockReason &&
      !isGenerating;

    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateCandidateComparison(jobId, selectedIds);

      setComparison(result.data.comparison);

      setUsage(result.data.usage);

      setRuntimeBlockReason(null);

      setSuccessMessage(result.message);

      onResultVisibilityChange?.(true);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);

      if (normalizedError.statusCode === 429) {
        setRuntimeBlockReason("daily_limit");
      }

      if (normalizedError.statusCode === 503) {
        setRuntimeBlockReason("feature_unavailable");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const statusLabel = (() => {
    if (comparison && selectionMatchesComparison) {
      return "Comparison generated";
    }

    if (comparison) {
      return "Cached comparison available";
    }

    if (insufficientCandidates) {
      return "More candidates required";
    }

    if (dailyLimitReached) {
      return "Limit reached";
    }

    if (featureUnavailable) {
      return "Unavailable";
    }

    if (!hasMinimumSelection) {
      return "Select candidates";
    }

    if (canGenerate) {
      return "Ready";
    }

    return "Unavailable";
  })();

  const comparedCandidates = normalizeItems(comparison?.candidates);

  const resultsTarget =
    typeof document !== "undefined" && resultsContainerId
      ? document.getElementById(resultsContainerId)
      : null;

  return (
    <>
      <AiCard className="h-full">
        <div className="flex h-full min-w-0 flex-col p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold leading-6 text-slate-950">
                  AI Candidate Comparison
                </h2>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Compare between {minimumCandidates} and{" "}
                {maximumCandidates || minimumCandidates} selected applicants
                side by side.
              </p>
            </div>
          </div>

          {errorMessage && (
            <Alert variant="error" className="mt-4">
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mt-4">
              {successMessage}
            </Alert>
          )}

          <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
            <div>
              {selectedApplications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedApplications.map((application) => (
                    <button
                      key={application.applicationId}
                      type="button"
                      onClick={() =>
                        onRemoveSelected(application.applicationId)
                      }
                      className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-violet-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold">
                        {getInitials(application.candidateName)}
                      </span>

                      <span className="min-w-0 truncate">
                        {application.candidateName}
                      </span>

                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-5 text-slate-500">
                  Select applicants using the Compare checkboxes below.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-slate-500">
                  {selectedIds.length} of{" "}
                  {maximumCandidates || minimumCandidates} selected ·{" "}
                  {statusLabel}
                </p>

                {usage && <AiUsageStatus usage={usage} className="mt-1" />}

                {!usage && insufficientCandidates && (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {eligibleApplicationCount} eligible applicants available.
                  </p>
                )}
              </div>

              <div className="w-auto flex flex-col gap-3">
                <div>
                  {comparison && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-expanded={isResultVisible}
                      onClick={() =>
                        onResultVisibilityChange?.(!isResultVisible)
                      }
                    >
                      {isResultVisible ? "Hide comparison" : "View comparison"}

                      {isResultVisible ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex justify-between">
                  {selectedIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClearSelected}
                    >
                      Clear
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ai"
                    size="sm"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <LoaderCircle
                          className="h-4 w-4 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        Comparing
                      </>
                    ) : dailyLimitReached ? (
                      "Limit reached"
                    ) : featureUnavailable ? (
                      "Unavailable"
                    ) : insufficientCandidates ? (
                      "More applicants needed"
                    ) : selectionMatchesComparison ? (
                      "Comparison ready"
                    ) : !hasMinimumSelection ? (
                      `Select ${minimumCandidates}`
                    ) : (
                      "Compare"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AiCard>

      {comparison &&
        isResultVisible &&
        resultsTarget &&
        createPortal(
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
            <header className="flex flex-col gap-3 border-b border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-medium leading-5 text-violet-700">
                  AI Candidate Comparison
                </p>

                <h2 className="text-xl font-semibold leading-7 text-slate-950">
                  Comparison results
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {comparison.selectedCandidateCount} applicants compared using
                  available application evidence.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onResultVisibilityChange?.(false)}
              >
                Hide comparison
              </Button>
            </header>

            <div className="grid gap-4 p-4 sm:p-5">
              <section className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                <p className="text-xs font-medium leading-5 text-violet-700">
                  Comparison overview
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {comparison.comparisonSummary ||
                    "No comparison summary was returned."}
                </p>
              </section>

              <div className="grid gap-4 lg:grid-cols-3">
                <InformationList
                  title="Shared strengths"
                  items={comparison.sharedStrengths}
                  emptyMessage="No shared strengths were identified."
                  variant="strength"
                />

                <InformationList
                  title="Key differences"
                  items={comparison.keyDifferences}
                  emptyMessage="No key differences were returned."
                  variant="difference"
                />

                <InformationList
                  title="Interview focus"
                  items={comparison.interviewFocus}
                  emptyMessage="No interview focus points were returned."
                  variant="verify"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {comparedCandidates.map((candidate) => (
                  <ComparedCandidateCard
                    key={candidate.applicationId}
                    candidate={candidate}
                    jobId={jobId}
                  />
                ))}
              </div>

              {comparedCandidates.length === 0 && (
                <p className="text-sm leading-6 text-slate-600">
                  No candidate details were returned.
                </p>
              )}

              <p className="text-xs leading-5 text-slate-500">
                This comparison does not rank, reject or change an application
                status.
              </p>
            </div>
          </section>,

          resultsTarget,
        )}
    </>
  );
};

export default CompanyCandidateComparisonCard;
