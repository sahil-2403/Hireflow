import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  FileSearch,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import { generateApplicationResumeReview } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import MatchScoreBadge from "../application/MatchScoreBadge";
import SkillMatchList from "../application/SkillMatchList";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const normalizeItems = (items) => {
  return Array.isArray(items) ? items.filter(Boolean) : [];
};

const ReviewList = ({ title, items, emptyMessage, variant = "default" }) => {
  const normalizedItems = normalizeItems(items);

  const variants = {
    default: {
      icon: Check,

      className: "bg-violet-100 text-violet-700",
    },

    strength: {
      icon: Check,

      className: "bg-emerald-100 text-emerald-700",
    },

    warning: {
      icon: TriangleAlert,

      className: "bg-amber-100 text-amber-700",
    },

    risk: {
      icon: TriangleAlert,

      className: "bg-red-100 text-red-700",
    },

    focus: {
      icon: CircleHelp,

      className: "bg-blue-100 text-blue-700",
    },
  };

  const config = variants[variant] || variants.default;

  const MarkerIcon = config.icon;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold leading-6 text-slate-950">
        {title}
      </h3>

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

const MatchedEvidenceList = ({ evidence }) => {
  const normalizedEvidence = Array.isArray(evidence)
    ? evidence.filter((item) => item?.evidence)
    : [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold leading-6 text-slate-950">
        Matched resume evidence
      </h3>

      {normalizedEvidence.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {normalizedEvidence.map((item, index) => (
            <article
              key={`${item.requirement || "evidence"}-${index}`}
              className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
            >
              {item.requirement && (
                <p className="text-xs font-medium leading-5 text-emerald-800">
                  {item.requirement}
                </p>
              )}

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {item.evidence}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          No specific resume evidence was returned.
        </p>
      )}
    </section>
  );
};

const ResumeReviewMetric = ({
  label,
  value,
  valueClassName = "text-slate-950",
  helper,
}) => {
  return (
    <div className="min-w-0 bg-white px-4 py-3">
      <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>

      <p
        className={[
          "mt-1 text-xl",
          "font-semibold",
          "leading-7",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </p>

      {helper && (
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{helper}</p>
      )}
    </div>
  );
};

const CompanyApplicationResumeReviewCard = ({
  applicationId,
  availability,
  isResultVisible = false,
  resultsContainerId,
  onResultVisibilityChange,
}) => {
  const [review, setReview] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setReview(availability?.review || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);

    setErrorMessage("");
    setSuccessMessage("");
  }, [applicationId, availability]);

  const blockReason = runtimeBlockReason || availability?.blockReason || null;

  const missingResume = blockReason === "missing_resume";

  const incompleteApplication = blockReason === "incomplete_application_data";

  const dailyLimitReached =
    blockReason === "daily_limit" ||
    Boolean(usage && usage.remaining <= 0 && !review);

  const canGenerate =
    availability?.canGenerate === true &&
    !review &&
    !blockReason &&
    !isGenerating;

  const handleGenerateReview = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      !review &&
      !runtimeBlockReason &&
      !isGenerating;

    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateApplicationResumeReview(applicationId);

      setReview(result.data.review);

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

      if (
        normalizedError.statusCode === 400 &&
        normalizedError.message.toLowerCase().includes("resume is missing")
      ) {
        setRuntimeBlockReason("missing_resume");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const statusLabel = (() => {
    if (review) {
      return "Review available";
    }

    if (missingResume) {
      return "Resume required";
    }

    if (incompleteApplication) {
      return "Data incomplete";
    }

    if (dailyLimitReached) {
      return "Limit reached";
    }

    if (canGenerate) {
      return "Ready";
    }

    return "Unavailable";
  })();

  const unavailableMessage = (() => {
    if (missingResume) {
      return "A submitted resume is required before this review can be generated.";
    }

    if (incompleteApplication) {
      return "Candidate or job information required for this review is incomplete.";
    }

    if (dailyLimitReached) {
      return "The company account has used all Resume Match Review requests available today.";
    }

    return null;
  })();

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
              <FileSearch className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                AI Resume Match Review
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Review resume evidence, strengths, gaps, risks and interview
                focus areas.
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
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant="violet" size="xs" className="normal-case">
                  {statusLabel}
                </Pill>

                {review && (
                  <MatchScoreBadge
                    size="sm"
                    match={{
                      matchScore: review.enhancedMatchScore,

                      matchLabel: review.alignmentLevel,
                    }}
                  />
                )}
              </div>

              {unavailableMessage && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {unavailableMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between">
              <div className="min-w-0">
                {usage ? (
                  <AiUsageStatus usage={usage} />
                ) : (
                  <p className="text-xs leading-5 text-slate-500">
                    Human review remains required.
                  </p>
                )}
              </div>

              {review ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-expanded={isResultVisible}
                  onClick={() => onResultVisibilityChange?.(!isResultVisible)}
                  className="shrink-0"
                >
                  {isResultVisible ? "Hide review" : "View review"}

                  {isResultVisible ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ai"
                  size="sm"
                  disabled={!canGenerate}
                  onClick={handleGenerateReview}
                  className="shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <LoaderCircle
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      Generating
                    </>
                  ) : dailyLimitReached ? (
                    "Limit reached"
                  ) : missingResume ? (
                    "Resume required"
                  ) : incompleteApplication ? (
                    "Unavailable"
                  ) : (
                    "Generate review"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </AiCard>

      {review &&
        isResultVisible &&
        resultsTarget &&
        createPortal(
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
            <header className="flex flex-col gap-3 border-b border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-medium leading-5 text-violet-700">
                  AI Resume Match Review
                </p>

                <h2 className="text-xl font-semibold leading-7 text-slate-950">
                  Resume review results
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Supporting resume evidence for human review.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onResultVisibilityChange?.(false)}
              >
                Hide review
              </Button>
            </header>

            <div className="grid gap-4 p-4 sm:p-5">
              <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
                <ResumeReviewMetric
                  label="Profile score"
                  value={`${review.profileScore}%`}
                />

                <ResumeReviewMetric
                  label="Resume-enhanced score"
                  value={`${review.enhancedMatchScore}%`}
                  valueClassName="text-violet-700"
                  helper={
                    Number(review.resumeBoost) > 0
                      ? `+${review.resumeBoost} resume boost`
                      : null
                  }
                />

                <ResumeReviewMetric
                  label="Confidence"
                  value={`${review.confidenceScore}%`}
                  helper={review.confidenceLevel}
                />
              </div>

              <section className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                <p className="text-xs font-medium leading-5 text-violet-700">
                  Review summary
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {review.summary || "No review summary was returned."}
                </p>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <SkillMatchList
                  title="Matched skills"
                  skills={review.matchedSkills || []}
                  emptyMessage="No matched skills were returned."
                  variant="matched"
                />

                <SkillMatchList
                  title="Missing skills"
                  skills={review.missingSkills || []}
                  emptyMessage="No missing skills were returned."
                  variant="missing"
                />
              </div>

              <MatchedEvidenceList evidence={review.matchedEvidence} />

              <div className="grid gap-4 lg:grid-cols-2">
                <ReviewList
                  title="Resume strengths"
                  items={review.resumeStrengths}
                  emptyMessage="No specific resume strengths were returned."
                  variant="strength"
                />

                <ReviewList
                  title="Missing or weak areas"
                  items={review.missingOrWeakAreas}
                  emptyMessage="No missing or weak areas were identified."
                  variant="warning"
                />

                <ReviewList
                  title="Interview focus"
                  items={review.interviewFocus}
                  emptyMessage="No interview focus areas were returned."
                  variant="focus"
                />

                <ReviewList
                  title="Risk notes"
                  items={review.riskNotes}
                  emptyMessage="No specific risk notes were returned."
                  variant="risk"
                />
              </div>

              <ReviewList
                title="Resume evidence used"
                items={review.resumeEvidence}
                emptyMessage="No additional resume evidence was returned."
              />

              <p className="text-xs leading-5 text-slate-500">
                Use this review as supporting evidence alongside interviews,
                work samples, references and human judgment. It must not be
                treated as an automatic hiring or rejection decision.
              </p>
            </div>
          </section>,

          resultsTarget,
        )}
    </>
  );
};

export default CompanyApplicationResumeReviewCard;
