import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { generateCandidateJobResumeFit } from "../../api/ai.api";

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

const FitDetailList = ({
  title,
  items,
  emptyMessage,
  marker = "✓",
  markerClassName = "bg-violet-100 text-violet-700",
}) => {
  const values = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>

      {values.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 grid gap-2.5">
          {values.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-start gap-2.5">
              <span
                className={[
                  "mt-0.5 grid h-5 w-5 shrink-0",
                  "place-items-center rounded-full",
                  "text-[10px] font-black",
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

const SkillCloud = ({ title, skills, variant = "blue", emptyMessage }) => {
  const values = Array.isArray(skills) ? skills : [];

  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>

      {values.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((skill) => (
            <Pill key={skill} variant={variant}>
              {skill}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
};

const FitScoreSummary = ({ fit }) => {
  const score = fit?.enhancedMatchScore ?? 0;
  const resumeBoost = fit?.resumeBoost ?? 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      <div
        className={[
          "rounded-2xl border p-4 text-center",
          getScoreClasses(score),
        ].join(" ")}
      >
        <p className="text-3xl font-black">{score}%</p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-wider">
          AI-enhanced fit
        </p>
      </div>

      <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center">
        <p className="text-2xl font-black text-slate-950">
          {fit.profileScore ?? 0}%
        </p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
          Profile score
        </p>
      </div>

      <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-center">
        <p className="text-2xl font-black text-violet-700">+{resumeBoost}</p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
          Resume evidence
        </p>
      </div>
    </div>
  );
};

const FitResultToggle = ({ fit, isOpen, onToggle }) => {
  const generatedAt = formatDate(fit?.generatedAt);

  return (
    <div className="rounded-2xl border border-violet-200 bg-white/85 p-4 shadow-sm shadow-violet-100">
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <div
            className={[
              "grid h-14 w-14 shrink-0",
              "place-items-center rounded-2xl border text-center",
              getScoreClasses(fit.enhancedMatchScore),
            ].join(" ")}
          >
            <div>
              <p className="text-lg font-black leading-none">
                {fit.enhancedMatchScore}
              </p>

              <p className="mt-1 text-[8px] font-black uppercase tracking-wider">
                Fit
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill variant="emerald">Review ready</Pill>

              {generatedAt && (
                <span className="text-xs text-slate-500">
                  Generated {generatedAt}
                </span>
              )}
            </div>

            <p className="mt-2 font-black text-slate-950">{fit.matchLabel}</p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {isOpen
                ? "Hide the detailed review to keep this sidebar compact."
                : "Open the review to see job requirements, missing areas, and improvements."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="candidate-job-resume-fit-result"
          className="gap-2"
        >
          {isOpen ? "Hide AI Resume Fit" : "View AI Resume Fit"}

          <span
            aria-hidden="true"
            className={[
              "transition-transform duration-300",
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

const CandidateJobResumeFitCard = ({
  jobId,
  availabilityStatus,
  availability,
  availabilityError = "",
}) => {
  const [fit, setFit] = useState(null);

  const [usage, setUsage] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFit(availability?.fit || null);
    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
    setErrorMessage("");
    setSuccessMessage("");

    // Cached results remain collapsed on normal visits.
    setIsResultOpen(false);
  }, [jobId, availability]);

  const handleGenerateFit = async () => {
    const isAllowed =
      availabilityStatus === "success" &&
      availability?.canGenerate &&
      !runtimeBlockReason &&
      !fit &&
      !isGenerating;

    // Prevent POST requests even if this handler is
    // triggered programmatically.
    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateCandidateJobResumeFit(jobId);

      setFit(result.data.fit);
      setUsage(result.data.usage);

      setRuntimeBlockReason(null);

      setSuccessMessage(result.message);

      // Open newly generated results immediately.
      setIsResultOpen(true);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);

      if (normalizedError.statusCode === 429) {
        setRuntimeBlockReason("daily_limit");
      }

      if (
        normalizedError.statusCode === 404 &&
        normalizedError.message.toLowerCase().includes("candidate profile")
      ) {
        setRuntimeBlockReason("missing_profile");
      }

      if (
        normalizedError.statusCode === 400 &&
        normalizedError.message
          .toLowerCase()
          .includes("generate ai resume insights")
      ) {
        setRuntimeBlockReason("missing_resume_insights");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const missingProfileFromRequest =
    availabilityStatus === "error" &&
    availabilityError.toLowerCase().includes("candidate profile not found");

  const blockReason =
    runtimeBlockReason ||
    availability?.blockReason ||
    (missingProfileFromRequest ? "missing_profile" : null);

  const missingProfile = blockReason === "missing_profile";

  const missingResume = blockReason === "missing_resume";

  const missingResumeInsights = blockReason === "missing_resume_insights";

  const dailyLimitReached =
    blockReason === "daily_limit" ||
    Boolean(usage && usage.remaining <= 0 && !fit);

  const isChecking =
    availabilityStatus === "idle" || availabilityStatus === "loading";

  const hasGenericAvailabilityError =
    availabilityStatus === "error" && !missingProfileFromRequest;

  const canGenerate =
    availabilityStatus === "success" &&
    availability?.canGenerate &&
    !fit &&
    !blockReason &&
    !isGenerating;

  return (
    <AiCard>
      <div className="border-b border-violet-200/80 bg-white/10 p-5">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <AiBadge>AI Resume Fit</AiBadge>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-950">
              How does your resume fit?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Compare your analyzed resume with this specific job before
              applying.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 bg-transparent p-5">
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {isChecking && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Checking availability...
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Checking your profile, Resume Insights, cached review, and
              remaining usage.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Checking availability...
            </Button>
          </div>
        )}

        {!isChecking && !fit && missingProfile && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Candidate profile required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create your candidate profile before checking AI Resume Fit.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Candidate profile required
            </Button>

            <Button
              as={Link}
              to="/candidate/profile"
              variant="secondary"
              fullWidth
              className="mt-3"
            >
              Go to candidate profile
            </Button>
          </div>
        )}

        {!isChecking && !fit && (missingResume || missingResumeInsights) && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              AI Resume Insights required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {missingResume
                ? "Upload your resume and generate AI Resume Insights before checking this job."
                : "Generate AI Resume Insights for your current resume before checking this job."}
            </p>

            <Button
              as={Link}
              to="/candidate/resume"
              variant="ai"
              fullWidth
              className="mt-4"
            >
              {missingResume
                ? "Upload resume and generate insights"
                : "Generate AI Resume Insights"}
            </Button>
          </div>
        )}

        {!isChecking && !fit && dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You have used all AI Resume Fit checks available today.
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

        {!isChecking && !fit && hasGenericAvailabilityError && (
          <div className="rounded-2xl border border-red-200 bg-white/80 p-4">
            <Alert variant="error">{availabilityError}</Alert>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              AI Resume Fit unavailable
            </Button>
          </div>
        )}

        {!isChecking && !fit && canGenerate && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Get a job-specific resume review
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              AI adds resume evidence and practical suggestions while the
              deterministic score remains the source of truth.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled={!canGenerate}
              onClick={handleGenerateFit}
            >
              {isGenerating
                ? "Checking AI Resume Fit..."
                : "Check AI Resume Fit"}
            </Button>
          </div>
        )}

        {fit && (
          <>
            <FitResultToggle
              fit={fit}
              isOpen={isResultOpen}
              onToggle={() => setIsResultOpen((currentValue) => !currentValue)}
            />

            <div
              id="candidate-job-resume-fit-result"
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
                  <FitScoreSummary fit={fit} />

                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                      AI summary
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {fit.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill variant="violet">
                        {fit.confidenceLevel || "Confidence unavailable"}
                      </Pill>

                      <Pill variant="blue">Profile + resume</Pill>
                    </div>
                  </div>

                  <SkillCloud
                    title="Matched skills"
                    skills={fit.matchedSkills}
                    variant="emerald"
                    emptyMessage="No matched skills were returned."
                  />

                  <SkillCloud
                    title="Missing skills"
                    skills={fit.missingSkills}
                    variant="amber"
                    emptyMessage="No missing skills were returned."
                  />

                  <FitDetailList
                    title="Matched requirements"
                    items={fit.matchedRequirements}
                    emptyMessage="No matched requirements were returned."
                    marker="✓"
                    markerClassName="bg-emerald-100 text-emerald-700"
                  />

                  <FitDetailList
                    title="Missing or weak requirements"
                    items={fit.missingRequirements}
                    emptyMessage="No missing requirements were identified."
                    marker="!"
                    markerClassName="bg-amber-100 text-amber-700"
                  />

                  <FitDetailList
                    title="Resume improvements"
                    items={fit.resumeImprovements}
                    emptyMessage="No resume improvements were returned."
                    marker="↑"
                    markerClassName="bg-blue-100 text-blue-700"
                  />

                  <FitDetailList
                    title="Profile improvements"
                    items={fit.profileImprovements}
                    emptyMessage="No profile improvements were returned."
                    marker="↑"
                    markerClassName="bg-violet-100 text-violet-700"
                  />

                  <FitDetailList
                    title="Before applying"
                    items={fit.beforeApplyingChecklist}
                    emptyMessage="No additional checklist items were returned."
                    marker="✓"
                    markerClassName="bg-slate-200 text-slate-700"
                  />

                  <FitDetailList
                    title="Resume evidence used"
                    items={fit.resumeEvidence}
                    emptyMessage="No additional resume evidence was returned."
                    marker="✦"
                    markerClassName="bg-indigo-100 text-indigo-700"
                  />
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

export default CandidateJobResumeFitCard;
