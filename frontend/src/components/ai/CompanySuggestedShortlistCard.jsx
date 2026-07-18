import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { generateSuggestedShortlist } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const InformationList = ({
  title,
  items,
  emptyMessage,
  marker = "•",
  markerClassName = "bg-violet-100 text-violet-700",
}) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
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

const SkillList = ({ title, skills, variant = "matched" }) => {
  const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : [];

  const pillVariant = variant === "missing" ? "amber" : "green";

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>

      {normalizedSkills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedSkills.map((skill) => (
            <Pill key={`${title}-${skill}`} variant={pillVariant}>
              {skill}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None listed.</p>
      )}
    </div>
  );
};

const ShortlistedCandidateCard = ({ candidate, position, jobId }) => {
  return (
    <article className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
              {position}
            </span>

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
          Suggested review summary
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {candidate.summary || "No candidate summary was returned."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InformationList
          title="Supporting strengths"
          items={candidate.strengths}
          emptyMessage="No specific strengths were returned."
          marker="✓"
          markerClassName="bg-emerald-100 text-emerald-700"
        />

        <InformationList
          title="Points to verify"
          items={candidate.verificationPoints}
          emptyMessage="No specific verification points were returned."
          marker="?"
          markerClassName="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:grid-cols-2">
        <SkillList title="Matched skills" skills={candidate.matchedSkills} />

        <SkillList
          title="Skills to verify"
          skills={candidate.missingSkills}
          variant="missing"
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

const CompanySuggestedShortlistCard = ({ jobId, availability }) => {
  const [shortlist, setShortlist] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setShortlist(availability?.shortlist || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
    setErrorMessage("");
    setSuccessMessage("");

    /*
     * Cached results begin collapsed.
     * Newly generated results are opened
     * automatically inside the handler.
     */
    setIsResultOpen(false);
  }, [jobId, availability]);

  const requestedLimit = Number(availability?.requestedLimit) || 0;

  const eligibleApplicationCount =
    Number(availability?.eligibleApplicationCount) || 0;

  const blockReason = runtimeBlockReason || availability?.blockReason || null;

  const noEligibleApplications = blockReason === "no_eligible_applications";

  const featureUnavailable = blockReason === "feature_unavailable";

  const dailyLimitReached =
    blockReason === "daily_limit" ||
    Boolean(usage && usage.remaining <= 0 && !shortlist);

  const shortlistGenerated = Boolean(shortlist);

  const canGenerate =
    availability?.canGenerate === true &&
    requestedLimit > 0 &&
    eligibleApplicationCount > 0 &&
    !shortlistGenerated &&
    !blockReason &&
    !isGenerating;

  const handleGenerate = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      requestedLimit > 0 &&
      eligibleApplicationCount > 0 &&
      !shortlistGenerated &&
      !blockReason &&
      !isGenerating;

    /*
     * Protect against accidental or
     * programmatic repeated requests.
     */
    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateSuggestedShortlist(jobId, requestedLimit);

      setShortlist(result.data.shortlist);

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
        normalizedError.message
          .toLowerCase()
          .includes("no eligible applications")
      ) {
        setRuntimeBlockReason("no_eligible_applications");
      }

      if (normalizedError.statusCode === 503) {
        setRuntimeBlockReason("feature_unavailable");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const statusLabel = (() => {
    if (shortlistGenerated) {
      return "Shortlist generated";
    }

    if (noEligibleApplications) {
      return "No eligible applicants";
    }

    if (dailyLimitReached) {
      return "Limit reached";
    }

    if (featureUnavailable) {
      return "Unavailable";
    }

    if (canGenerate) {
      return "Ready";
    }

    return "Unavailable";
  })();

  const candidates = Array.isArray(shortlist?.candidates)
    ? shortlist.candidates
    : [];

  return (
    <AiCard>
      <div className="border-b border-violet-200/80 bg-white/10 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <AiBadge>AI Suggested Shortlist</AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Review a focused set of applicants
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              HireFlow combines the deterministic match results with available
              resume-review evidence to suggest applicants worth reviewing
              closely.
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              This does not change application statuses, reject candidates, or
              make hiring decisions.
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

        {!shortlistGenerated && noEligibleApplications && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              No eligible applications
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The shortlist requires at least one complete application in
              applied, screening, or interview status with a submitted resume.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Eligible applications required
            </Button>
          </div>
        )}

        {!shortlistGenerated && featureUnavailable && (
          <div className="rounded-2xl border border-red-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              AI Suggested Shortlist unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The shortlist feature is not currently configured.
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

        {!shortlistGenerated && dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your company account has used all AI Suggested Shortlist requests
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

        {!shortlistGenerated && canGenerate && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Generate a shortlist of up to {requestedLimit}{" "}
              {requestedLimit === 1 ? "applicant" : "applicants"}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {eligibleApplicationCount} complete{" "}
              {eligibleApplicationCount === 1
                ? "application is"
                : "applications are"}{" "}
              currently eligible.
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
                ? "Generating AI Suggested Shortlist..."
                : "Generate AI Suggested Shortlist"}
            </Button>
          </div>
        )}

        {shortlistGenerated && (
          <>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-black text-slate-950">
                Shortlist generated
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                A shortlist has already been generated for the current job and
                eligible applicant set. Review the result below.
              </p>

              <Button
                type="button"
                variant="ai"
                fullWidth
                className="mt-4"
                disabled
              >
                Shortlist generated
              </Button>
            </div>

            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="company-suggested-shortlist-results"
              className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-left transition hover:bg-white"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                    Suggested applicants
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {candidates.length} of {shortlist.totalEligibleCandidates}{" "}
                    eligible{" "}
                    {shortlist.totalEligibleCandidates === 1
                      ? "applicant"
                      : "applicants"}
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
              id="company-suggested-shortlist-results"
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
                  {candidates.map((candidate, index) => (
                    <ShortlistedCandidateCard
                      key={candidate.applicationId}
                      candidate={candidate}
                      position={index + 1}
                      jobId={jobId}
                    />
                  ))}

                  {candidates.length === 0 && (
                    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                      <p className="text-sm text-slate-600">
                        No candidates were returned in this shortlist.
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Human review required
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Review every candidate using interviews, work samples,
                      references, accessibility needs, and role-specific
                      context. This shortlist is only a review aid.
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

export default CompanySuggestedShortlistCard;
