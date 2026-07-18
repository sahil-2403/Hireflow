import { useEffect, useState } from "react";

import { generateApplicationInterviewKit } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import Alert from "../ui/Alert";
import Button from "../ui/Button";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const normalizeQuestions = (questions) => {
  return Array.isArray(questions)
    ? questions.filter((item) => item?.question)
    : [];
};

const QuestionGroup = ({ title, description, questions }) => {
  const normalizedQuestions = normalizeQuestions(questions);

  return (
    <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>

      {normalizedQuestions.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {normalizedQuestions.map((item, index) => (
            <article
              key={`${title}-${index}`}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-bold leading-6 text-slate-900">
                    {item.question}
                  </p>

                  {item.whyAsk && (
                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-violet-700">
                        Why ask this
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {item.whyAsk}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No questions were generated for this category.
        </p>
      )}
    </section>
  );
};

const EvaluationChecklist = ({ items }) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <p className="text-sm font-black text-slate-950">
        Interview evaluation checklist
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        Use this as a consistent review guide while recording interview
        evidence.
      </p>

      {normalizedItems.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {normalizedItems.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                ✓
              </span>

              <span className="text-sm leading-6 text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No evaluation checklist was generated.
        </p>
      )}
    </section>
  );
};

const CompanyApplicationInterviewKitCard = ({
  applicationId,
  availability,
}) => {
  const [interviewKit, setInterviewKit] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setInterviewKit(availability?.interviewKit || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
    setErrorMessage("");
    setSuccessMessage("");

    /*
     * Cached results start collapsed.
     * Newly generated results open
     * automatically in handleGenerate.
     */
    setIsResultOpen(false);
  }, [applicationId, availability]);

  const interviewKitGenerated = Boolean(interviewKit);

  const blockReason = runtimeBlockReason || availability?.blockReason || null;

  const missingResume = blockReason === "missing_resume";

  const incompleteApplication = blockReason === "incomplete_application_data";

  const featureUnavailable = blockReason === "feature_unavailable";

  const dailyLimitReached =
    blockReason === "daily_limit" ||
    Boolean(usage && usage.remaining <= 0 && !interviewKitGenerated);

  const canGenerate =
    availability?.canGenerate === true &&
    !interviewKitGenerated &&
    !blockReason &&
    !isGenerating;

  const handleGenerate = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      !interviewKitGenerated &&
      !blockReason &&
      !isGenerating;

    /*
     * Prevent accidental double clicks
     * and programmatic repeated calls.
     */
    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateApplicationInterviewKit(applicationId);

      setInterviewKit(result.data.interviewKit);

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

      if (
        normalizedError.statusCode === 400 &&
        normalizedError.message.toLowerCase().includes("resume is missing")
      ) {
        setRuntimeBlockReason("missing_resume");
      }

      if (
        normalizedError.statusCode === 400 &&
        normalizedError.message.toLowerCase().includes("data is incomplete")
      ) {
        setRuntimeBlockReason("incomplete_application_data");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const statusLabel = (() => {
    if (interviewKitGenerated) {
      return "Interview kit generated";
    }

    if (missingResume) {
      return "Resume required";
    }

    if (incompleteApplication) {
      return "Application incomplete";
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

  return (
    <AiCard>
      <div className="border-b border-violet-200/80 bg-white/10 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <AiBadge>AI Interview Kit</AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Prepare a focused interview
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Generate technical, project, skill-gap, and behavioral questions
              using this job, candidate profile, and submitted resume.
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              The kit is an interview preparation aid. It does not score the
              interview, change application status, or make a hiring decision.
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

        {!interviewKitGenerated && missingResume && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Submitted resume required
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This application does not have a submitted resume available for
              interview-kit generation.
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

        {!interviewKitGenerated && incompleteApplication && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Application data incomplete
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The job or candidate data required for this interview kit is
              unavailable.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Application data required
            </Button>
          </div>
        )}

        {!interviewKitGenerated && featureUnavailable && (
          <div className="rounded-2xl border border-red-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              AI Interview Kit unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The AI provider is not currently available for interview-kit
              generation.
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

        {!interviewKitGenerated && dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your company account has used all AI Interview Kit requests
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

        {!interviewKitGenerated && canGenerate && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Generate candidate-specific interview questions
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              The generated kit will use the current job requirements and the
              resume submitted with this application.
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
                ? "Generating AI Interview Kit..."
                : "Generate AI Interview Kit"}
            </Button>
          </div>
        )}

        {interviewKitGenerated && (
          <>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-black text-slate-950">
                Interview kit generated
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                A current interview kit already exists for this job and
                submitted resume. Review it below.
              </p>

              <Button
                type="button"
                variant="ai"
                fullWidth
                className="mt-4"
                disabled
              >
                Interview kit generated
              </Button>
            </div>

            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="company-interview-kit-results"
              className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-left transition hover:bg-white"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                    Interview questions
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {isResultOpen
                      ? "Hide interview kit"
                      : "Review interview kit"}
                  </p>
                </div>

                <span className="text-lg font-black text-violet-700">
                  {isResultOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            <div
              id="company-interview-kit-results"
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
                  <QuestionGroup
                    title="Technical questions"
                    description="Explore the candidate's role-related technical knowledge and implementation choices."
                    questions={interviewKit.technicalQuestions}
                  />

                  <QuestionGroup
                    title="Project questions"
                    description="Validate project ownership, architecture decisions, and practical implementation experience."
                    questions={interviewKit.projectQuestions}
                  />

                  <QuestionGroup
                    title="Skill-gap questions"
                    description="Clarify skills or experience that are missing, weak, or unclear in the available evidence."
                    questions={interviewKit.skillGapQuestions}
                  />

                  <QuestionGroup
                    title="Behavioral questions"
                    description="Understand communication, collaboration, ownership, debugging, and problem-solving behavior."
                    questions={interviewKit.behavioralQuestions}
                  />

                  <EvaluationChecklist
                    items={interviewKit.evaluationChecklist}
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Interview guidance
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Ask consistent core questions across candidates, record
                      evidence rather than impressions, and avoid questions
                      involving protected personal characteristics.
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

export default CompanyApplicationInterviewKitCard;
