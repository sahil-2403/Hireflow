import { useEffect, useState } from "react";

import { generateApplicationResumeReview } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import MatchScoreBadge from "../application/MatchScoreBadge";
import SkillMatchList from "../application/SkillMatchList";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const ReviewList = ({
  title,
  items,
  emptyMessage,
  marker = "•",
  markerClassName = "bg-violet-100 text-violet-700",
}) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-600">
        {title}
      </p>

      {normalizedItems.length > 0 ? (
        <ul className="mt-3 grid gap-3">
          {normalizedItems.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="flex gap-3 text-sm leading-6 text-slate-700"
            >
              <span
                className={[
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center",
                  "rounded-full text-xs font-black",
                  markerClassName,
                ].join(" ")}
              >
                {marker}
              </span>

              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
};

const MatchedEvidenceList = ({ evidence }) => {
  const normalizedEvidence = Array.isArray(evidence)
    ? evidence.filter((item) => item?.evidence)
    : [];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
        Matched resume evidence
      </p>

      {normalizedEvidence.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {normalizedEvidence.map((item, index) => (
            <div
              key={`${item.requirement || "evidence"}-${index}`}
              className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"
            >
              {item.requirement && (
                <p className="text-xs font-black text-emerald-800">
                  {item.requirement}
                </p>
              )}

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {item.evidence}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No specific resume evidence was returned.
        </p>
      )}
    </div>
  );
};

const CompanyApplicationResumeReviewCard = ({
  applicationId,
  availability,
}) => {
  const [review, setReview] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setReview(availability?.review || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
    setErrorMessage("");
    setSuccessMessage("");

    /*
     * Cached results begin collapsed.
     * Newly generated results open
     * automatically.
     */
    setIsResultOpen(false);
  }, [applicationId, availability]);

  const handleGenerateReview = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      !review &&
      !runtimeBlockReason &&
      !isGenerating;

    /*
     * Guard against programmatic calls
     * when the UI is not eligible.
     */
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

      setIsResultOpen(true);
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

  const statusLabel = (() => {
    if (review) {
      return "Ready";
    }

    if (missingResume) {
      return "Resume unavailable";
    }

    if (incompleteApplication) {
      return "Data incomplete";
    }

    if (dailyLimitReached) {
      return "Limit reached";
    }

    if (canGenerate) {
      return "On demand";
    }

    return "Unavailable";
  })();

  return (
    <AiCard>
      <div className="border-b border-violet-200/80 bg-white/10 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <AiBadge>AI Resume Match Review</AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Review the submitted resume against this job
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              AI summarizes resume evidence, strengths, gaps, risks, and
              interview focus areas. The deterministic match score remains the
              structured comparison.
            </p>
          </div>

          <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Status
            </p>

            <p className="mt-1 text-sm font-black text-violet-700">
              {statusLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {!review && missingResume && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Submitted resume unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This application does not have a submitted resume, so an AI Resume
              Match Review cannot be generated.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Resume required
            </Button>
          </div>
        )}

        {!review && incompleteApplication && (
          <div className="rounded-2xl border border-red-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Application data incomplete
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The candidate or job record is unavailable. The review cannot be
              generated safely.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Review unavailable
            </Button>
          </div>
        )}

        {!review && dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your company account has used all AI Resume Match Reviews
              available for today.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Daily AI limit reached
            </Button>
          </div>
        )}

        {!review && canGenerate && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Generate a resume-based review
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The submitted resume will be analyzed against this job. This
              assists review and does not make hiring or rejection decisions.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled={!canGenerate}
              onClick={handleGenerateReview}
            >
              {isGenerating
                ? "Generating AI Resume Match Review..."
                : "Generate AI Resume Match Review"}
            </Button>
          </div>
        )}

        {review && (
          <>
            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="company-application-resume-review-result"
              className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-left transition hover:bg-white"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                    Review available
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {isResultOpen
                      ? "Hide detailed review"
                      : "Show detailed review"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <MatchScoreBadge
                    size="sm"
                    match={{
                      matchScore: review.enhancedMatchScore,

                      matchLabel: review.alignmentLevel,
                    }}
                  />

                  {Number(review.resumeBoost) > 0 && (
                    <Pill variant="violet">
                      +{review.resumeBoost} resume boost
                    </Pill>
                  )}

                  <span className="text-lg font-black text-violet-700">
                    {isResultOpen ? "−" : "+"}
                  </span>
                </div>
              </div>
            </button>

            <div
              id="company-application-resume-review-result"
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
                <div className="grid gap-4 pt-1">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Profile score
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {review.profileScore}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Resume-enhanced score
                      </p>

                      <p className="mt-1 text-2xl font-black text-violet-700">
                        {review.enhancedMatchScore}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Confidence
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {review.confidenceScore}%
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {review.confidenceLevel}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                      AI summary
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {review.summary}
                    </p>
                  </div>

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

                  <ReviewList
                    title="Resume strengths"
                    items={review.resumeStrengths}
                    emptyMessage="No specific resume strengths were returned."
                    marker="✓"
                    markerClassName="bg-emerald-100 text-emerald-700"
                  />

                  <ReviewList
                    title="Missing or weak areas"
                    items={review.missingOrWeakAreas}
                    emptyMessage="No missing or weak areas were identified."
                    marker="!"
                    markerClassName="bg-amber-100 text-amber-700"
                  />

                  <ReviewList
                    title="Interview focus"
                    items={review.interviewFocus}
                    emptyMessage="No interview focus areas were returned."
                    marker="?"
                    markerClassName="bg-blue-100 text-blue-700"
                  />

                  <ReviewList
                    title="Risk notes"
                    items={review.riskNotes}
                    emptyMessage="No specific risk notes were returned."
                    marker="!"
                    markerClassName="bg-red-100 text-red-700"
                  />

                  <ReviewList
                    title="Resume evidence used"
                    items={review.resumeEvidence}
                    emptyMessage="No additional resume evidence was returned."
                    marker="✦"
                    markerClassName="bg-indigo-100 text-indigo-700"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Review guidance
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Use this review as supporting evidence alongside
                      interviews, work samples, references, and human judgment.
                      Do not treat it as an automatic hiring or rejection
                      decision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {usage && <AiUsageStatus usage={usage} />}
      </div>
    </AiCard>
  );
};

export default CompanyApplicationResumeReviewCard;
