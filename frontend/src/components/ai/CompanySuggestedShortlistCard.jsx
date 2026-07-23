import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { Link } from "react-router-dom";

import {
  ChevronDown,
  ChevronUp,
  Check,
  CircleHelp,
  LoaderCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { generateSuggestedShortlist } from "../../api/ai.api";

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

  const isStrength = variant === "strength";

  const MarkerIcon = isStrength ? Check : CircleHelp;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
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

                  isStrength
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700",
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

const SkillList = ({ title, skills, variant = "matched" }) => {
  const normalizedSkills = normalizeItems(skills);

  const pillVariant = variant === "missing" ? "amber" : "green";

  return (
    <div>
      <p className="text-xs font-medium leading-5 text-slate-500">{title}</p>

      {normalizedSkills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedSkills.map((skill) => (
            <Pill
              key={`${title}-${skill}`}
              variant={pillVariant}
              size="xs"
              className="normal-case"
            >
              {skill}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">None listed.</p>
      )}
    </div>
  );
};

const ShortlistedCandidateCard = ({ candidate, position, jobId }) => {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
              {position}
            </span>

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
          Suggested review summary
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {candidate.summary || "No candidate summary was returned."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <InformationList
          title="Supporting strengths"
          items={candidate.strengths}
          emptyMessage="No specific strengths were returned."
          variant="strength"
        />

        <InformationList
          title="Points to verify"
          items={candidate.verificationPoints}
          emptyMessage="No verification points were returned."
          variant="verify"
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4 lg:grid-cols-2">
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

const CompanySuggestedShortlistCard = ({
  jobId,
  availability,
  isResultVisible = false,
  resultsContainerId,
  onResultVisibilityChange,
}) => {
  const [shortlist, setShortlist] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setShortlist(availability?.shortlist || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);

    setErrorMessage("");
    setSuccessMessage("");
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

      onResultVisibilityChange?.(true);
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
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold leading-6 text-slate-950">
                  AI Suggested Shortlist
                </h2>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Focus on applicants supported by deterministic match data and
                available resume evidence.
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3 text-xs font-medium text-violet-700">
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />

                {shortlistGenerated
                  ? `${candidates.length} suggested`
                  : `${eligibleApplicationCount} eligible`}
              </div>

              <span className="text-xs font-medium leading-5 text-slate-500">
                {statusLabel}
              </span>
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

              {shortlistGenerated ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-expanded={isResultVisible}
                  onClick={() => onResultVisibilityChange?.(!isResultVisible)}
                  className="shrink-0"
                >
                  {isResultVisible ? "Hide shortlist" : "View shortlist"}

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
                  onClick={handleGenerate}
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
                  ) : noEligibleApplications ? (
                    "Applicants required"
                  ) : featureUnavailable ? (
                    "Unavailable"
                  ) : (
                    "Generate shortlist"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </AiCard>

      {shortlistGenerated &&
        isResultVisible &&
        resultsTarget &&
        createPortal(
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
            <header className="flex flex-col gap-3 border-b border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-medium leading-5 text-violet-700">
                  AI Suggested Shortlist
                </p>

                <h2 className="text-xl font-semibold leading-7 text-slate-950">
                  Suggested applicants
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {candidates.length} of {shortlist.totalEligibleCandidates}{" "}
                  eligible applicants returned.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onResultVisibilityChange?.(false)}
              >
                Hide shortlist
              </Button>
            </header>

            <div className="grid gap-4 p-4 sm:p-5">
              {candidates.map((candidate, index) => (
                <ShortlistedCandidateCard
                  key={candidate.applicationId}
                  candidate={candidate}
                  position={index + 1}
                  jobId={jobId}
                />
              ))}

              {candidates.length === 0 && (
                <p className="text-sm leading-6 text-slate-600">
                  No candidates were returned.
                </p>
              )}

              <p className="text-xs leading-5 text-slate-500">
                This shortlist is a review aid only. Verify applicants using
                consistent, role-related criteria.
              </p>
            </div>
          </section>,

          resultsTarget,
        )}
    </>
  );
};

export default CompanySuggestedShortlistCard;
