import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { generateCandidateComparison } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const normalizeItems = (items) => {
  return Array.isArray(items) ? items.filter(Boolean) : [];
};

const InformationList = ({
  title,
  items,
  emptyMessage,
  marker = "•",
  markerClassName = "bg-violet-100 text-violet-700",
}) => {
  const normalizedItems = normalizeItems(items);

  return (
    <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-600">
        {title}
      </p>

      {normalizedItems.length > 0 ? (
        <ul className="mt-4 grid gap-3">
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
    </section>
  );
};

const SkillList = ({ title, skills, variant, emptyMessage }) => {
  const normalizedSkills = normalizeItems(skills);

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>

      {normalizedSkills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedSkills.map((skill) => (
            <Pill key={`${title}-${skill}`} variant={variant}>
              {skill}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </div>
  );
};

const ComparedCandidateCard = ({ candidate, jobId }) => {
  return (
    <article className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-950">
              {candidate.candidateName || "Candidate"}
            </h3>

            <ApplicationStatusBadge status={candidate.applicationStatus} />
          </div>

          {candidate.headline && (
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {candidate.headline}
            </p>
          )}

          {candidate.confidenceLevel && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Match confidence:{" "}
              <span className="text-slate-700">
                {candidate.confidenceLevel}
              </span>
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

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
        <p className="text-xs font-black uppercase tracking-wider text-violet-700">
          Comparison summary
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {candidate.summary || "No candidate summary was returned."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InformationList
          title="Strongest evidence"
          items={candidate.strongestEvidence}
          emptyMessage="No specific evidence was returned."
          marker="✓"
          markerClassName="bg-emerald-100 text-emerald-700"
        />

        <InformationList
          title="Concerns to verify"
          items={candidate.concernsToVerify}
          emptyMessage="No specific concerns were returned."
          marker="?"
          markerClassName="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:grid-cols-2">
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

const CompanyCandidateComparisonCard = ({
  jobId,
  availability,
  selectedApplications,
  onRemoveSelected,
  onClearSelected,
}) => {
  const [comparison, setComparison] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setComparison(availability?.comparison || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
    setErrorMessage("");
    setSuccessMessage("");

    /*
     * Cached comparisons begin collapsed.
     * Newly generated results are opened
     * inside handleGenerate.
     */
    setIsResultOpen(false);
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

    /*
     * Protect against double clicks and
     * programmatic repeat requests.
     */
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

      setIsResultOpen(true);
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

  return (
    <AiCard>
      <div className="border-b border-violet-200/80 bg-white/10 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <AiBadge>AI Candidate Comparison</AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Compare selected applicants
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Select between {minimumCandidates} and{" "}
              {maximumCandidates || minimumCandidates} applicants to review
              shared strengths, differences, evidence, and interview focus.
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              This comparison does not rank candidates, change application
              statuses, reject applicants, or make a hiring decision.
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

        <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">
                Selected applicants
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {selectedIds.length} of {maximumCandidates || minimumCandidates}{" "}
                selected. Use the Compare checkbox on applicant cards.
              </p>
            </div>

            {selectedIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onClearSelected}
              >
                Clear selection
              </Button>
            )}
          </div>

          {selectedApplications.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedApplications.map((application) => (
                <button
                  key={application.applicationId}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                  onClick={() => onRemoveSelected(application.applicationId)}
                >
                  <span>{application.candidateName}</span>

                  <span aria-hidden="true" className="text-sm">
                    ×
                  </span>

                  <span className="sr-only">
                    Remove {application.candidateName} from comparison
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No applicants selected.
            </p>
          )}
        </div>

        {!comparison && insufficientCandidates && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              More applicants required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              At least {minimumCandidates} complete applications are required.
              This job currently has {eligibleApplicationCount}.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              More applicants required
            </Button>
          </div>
        )}

        {!comparison && featureUnavailable && (
          <div className="rounded-2xl border border-red-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              AI Candidate Comparison unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The comparison feature is not currently configured.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Feature unavailable
            </Button>
          </div>
        )}

        {dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Existing comparisons remain available, but another candidate set
              cannot be generated today.
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

        {!featureUnavailable &&
          !insufficientCandidates &&
          !dailyLimitReached && (
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-black text-slate-950">
                {selectionMatchesComparison
                  ? "This candidate comparison is already generated"
                  : "Generate a comparison for the selected applicants"}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {!hasMinimumSelection
                  ? `Select at least ${minimumCandidates} applicants from the list below.`
                  : selectionMatchesComparison
                    ? "The stored result for this exact candidate set is available below."
                    : "Only the selected candidate set will be included."}
              </p>

              <Button
                type="button"
                variant="ai"
                fullWidth
                className="mt-4"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                {isGenerating
                  ? "Generating AI Candidate Comparison..."
                  : selectionMatchesComparison
                    ? "Comparison generated"
                    : !hasMinimumSelection
                      ? `Select at least ${minimumCandidates} applicants`
                      : "Generate AI Candidate Comparison"}
              </Button>
            </div>
          )}

        {comparison && (
          <>
            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="company-candidate-comparison-results"
              className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-left transition hover:bg-white"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                    Stored comparison
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {comparison.selectedCandidateCount} applicants
                    {" · "}
                    {isResultOpen ? "Hide details" : "Review details"}
                  </p>
                </div>

                <span className="text-lg font-black text-violet-700">
                  {isResultOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            <div
              id="company-candidate-comparison-results"
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
                  <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                      Comparison overview
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {comparison.comparisonSummary ||
                        "No comparison summary was returned."}
                    </p>
                  </section>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <InformationList
                      title="Shared strengths"
                      items={comparison.sharedStrengths}
                      emptyMessage="No shared strengths were identified."
                      marker="✓"
                      markerClassName="bg-emerald-100 text-emerald-700"
                    />

                    <InformationList
                      title="Key differences"
                      items={comparison.keyDifferences}
                      emptyMessage="No key differences were returned."
                      marker="↔"
                      markerClassName="bg-blue-100 text-blue-700"
                    />

                    <InformationList
                      title="Interview focus"
                      items={comparison.interviewFocus}
                      emptyMessage="No interview focus points were returned."
                      marker="?"
                      markerClassName="bg-amber-100 text-amber-700"
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
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                      <p className="text-sm text-slate-600">
                        No candidate details were returned.
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Human review required
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Compare evidence using consistent role-related criteria.
                      Review interviews, work samples, references, and relevant
                      context before changing any application status.
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

export default CompanyCandidateComparisonCard;
