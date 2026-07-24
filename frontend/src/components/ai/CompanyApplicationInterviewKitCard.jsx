import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import {
  Check,
  ChevronDown,
  ChevronUp,
  ListChecks,
  LoaderCircle,
} from "lucide-react";

import { generateApplicationInterviewKit } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

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
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold leading-6 text-slate-950">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>

      {normalizedQuestions.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {normalizedQuestions.map((item, index) => (
            <article
              key={`${title}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <div className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-medium leading-6 text-slate-900">
                    {item.question}
                  </p>

                  {item.whyAsk && (
                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                      <p className="text-xs font-medium leading-5 text-violet-700">
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
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No questions were generated for this category.
        </p>
      )}
    </section>
  );
};

const EvaluationChecklist = ({ items }) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold leading-6 text-slate-950">
        Interview evaluation checklist
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        Use consistent criteria while recording interview evidence.
      </p>

      {normalizedItems.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {normalizedItems.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>

              <span className="text-sm leading-6 text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No evaluation checklist was generated.
        </p>
      )}
    </section>
  );
};

const CompanyApplicationInterviewKitCard = ({
  applicationId,
  availability,
  isResultVisible = false,
  resultsContainerId,
  onResultVisibilityChange,
}) => {
  const [interviewKit, setInterviewKit] = useState(null);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setInterviewKit(availability?.interviewKit || null);

    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);

    setErrorMessage("");
    setSuccessMessage("");
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
      return "Kit available";
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

    if (featureUnavailable) {
      return "Unavailable";
    }

    if (canGenerate) {
      return "Ready";
    }

    return "Unavailable";
  })();

  const unavailableMessage = (() => {
    if (missingResume) {
      return "A submitted resume is required before an interview kit can be generated.";
    }

    if (incompleteApplication) {
      return "Candidate or job information required for this kit is incomplete.";
    }

    if (dailyLimitReached) {
      return "The company account has used all Interview Kit requests available today.";
    }

    if (featureUnavailable) {
      return "The AI provider is not currently available for interview-kit generation.";
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
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                AI Interview Kit
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Generate technical, project, skill-gap and behavioral interview
                questions.
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
              <Pill variant="violet" size="xs" className="normal-case">
                {statusLabel}
              </Pill>

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
                    The kit supports interview preparation and does not make a
                    hiring decision.
                  </p>
                )}
              </div>

              {interviewKitGenerated ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-expanded={isResultVisible}
                  onClick={() => onResultVisibilityChange?.(!isResultVisible)}
                  className="shrink-0"
                >
                  {isResultVisible ? "Hide kit" : "View kit"}

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
                  ) : missingResume ? (
                    "Resume required"
                  ) : incompleteApplication ? (
                    "Unavailable"
                  ) : featureUnavailable ? (
                    "Unavailable"
                  ) : (
                    "Generate kit"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </AiCard>

      {interviewKitGenerated &&
        isResultVisible &&
        resultsTarget &&
        createPortal(
          <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
            <header className="flex flex-col gap-3 border-b border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs font-medium leading-5 text-violet-700">
                  AI Interview Kit
                </p>

                <h2 className="text-xl font-semibold leading-7 text-slate-950">
                  Interview questions
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Candidate-specific preparation based on the current job and
                  submitted resume.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onResultVisibilityChange?.(false)}
              >
                Hide kit
              </Button>
            </header>

            <div className="grid gap-4 p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <QuestionGroup
                  title="Technical questions"
                  description="Explore role-related technical knowledge and implementation choices."
                  questions={interviewKit.technicalQuestions}
                />

                <QuestionGroup
                  title="Project questions"
                  description="Validate project ownership, architecture decisions and practical implementation."
                  questions={interviewKit.projectQuestions}
                />

                <QuestionGroup
                  title="Skill-gap questions"
                  description="Clarify skills or experience that are missing, weak or unclear."
                  questions={interviewKit.skillGapQuestions}
                />

                <QuestionGroup
                  title="Behavioral questions"
                  description="Understand communication, collaboration, ownership and problem-solving."
                  questions={interviewKit.behavioralQuestions}
                />
              </div>

              <EvaluationChecklist items={interviewKit.evaluationChecklist} />

              <p className="text-xs leading-5 text-slate-500">
                Ask consistent core questions across candidates, record evidence
                rather than impressions and avoid questions involving protected
                personal characteristics.
              </p>
            </div>
          </section>,

          resultsTarget,
        )}
    </>
  );
};

export default CompanyApplicationInterviewKitCard;
