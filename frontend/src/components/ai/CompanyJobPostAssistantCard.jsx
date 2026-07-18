import { useEffect, useMemo, useState } from "react";

import { useWatch } from "react-hook-form";

import { generateJobPostAssistantSuggestions } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";

import Alert from "../ui/Alert";
import Button from "../ui/Button";

import AiBadge from "./AiBadge";
import AiCard from "./AiCard";
import AiUsageStatus from "./AiUsageStatus";

const splitLines = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitCommaList = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

const addStringIfValid = ({ target, key, value, minimumLength = 1 }) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (normalizedValue.length >= minimumLength) {
    target[key] = normalizedValue;
  }
};

const buildAiJobDraft = (formValues) => {
  const draft = {};

  addStringIfValid({
    target: draft,
    key: "title",
    value: formValues?.title,
    minimumLength: 2,
  });

  addStringIfValid({
    target: draft,
    key: "description",
    value: formValues?.description,
    minimumLength: 5,
  });

  const responsibilities = splitLines(formValues?.responsibilitiesText);

  const requirements = splitLines(formValues?.requirementsText);

  const skills = splitCommaList(formValues?.skillsText);

  if (responsibilities.length > 0) {
    draft.responsibilities = responsibilities;
  }

  if (requirements.length > 0) {
    draft.requirements = requirements;
  }

  if (skills.length > 0) {
    draft.skills = skills;
  }

  addStringIfValid({
    target: draft,
    key: "location",
    value: formValues?.location,
    minimumLength: 2,
  });

  if (formValues?.employmentType) {
    draft.employmentType = formValues.employmentType;
  }

  if (formValues?.workplaceType) {
    draft.workplaceType = formValues.workplaceType;
  }

  if (formValues?.experienceLevel) {
    draft.experienceLevel = formValues.experienceLevel;
  }

  const salaryMin = toOptionalNumber(formValues?.salaryMin);

  const salaryMax = toOptionalNumber(formValues?.salaryMax);

  /*
   * Do not let an unfinished salary range
   * prevent content suggestions.
   */
  if (salaryMin !== null && salaryMax !== null) {
    if (salaryMin <= salaryMax) {
      draft.salaryMin = salaryMin;
      draft.salaryMax = salaryMax;
    }
  } else {
    if (salaryMin !== null) {
      draft.salaryMin = salaryMin;
    }

    if (salaryMax !== null) {
      draft.salaryMax = salaryMax;
    }
  }

  const salaryCurrency = formValues?.salaryCurrency?.trim().toUpperCase();

  if (salaryCurrency?.length === 3) {
    draft.salaryCurrency = salaryCurrency;
  }

  if (typeof formValues?.isSalaryVisible === "boolean") {
    draft.isSalaryVisible = formValues.isSalaryVisible;
  }

  return draft;
};

const hasMeaningfulJobDraft = (draft) => {
  return Boolean(
    draft.title ||
    draft.description ||
    draft.responsibilities?.length > 0 ||
    draft.requirements?.length > 0 ||
    draft.skills?.length > 0,
  );
};

const mergeSkills = (currentSkillsText, suggestedSkills) => {
  const mergedSkills = new Map();

  [
    ...splitCommaList(currentSkillsText),
    ...(Array.isArray(suggestedSkills) ? suggestedSkills : []),
  ].forEach((skill) => {
    const normalizedSkill = String(skill).trim();

    if (!normalizedSkill) {
      return;
    }

    const key = normalizedSkill.toLowerCase();

    if (!mergedSkills.has(key)) {
      mergedSkills.set(key, normalizedSkill);
    }
  });

  return [...mergedSkills.values()].join(", ");
};

const SuggestionBlock = ({
  title,
  children,
  onApply,
  applyLabel = "Apply",
}) => {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-violet-700">
          {title}
        </p>

        {onApply && (
          <Button type="button" size="sm" variant="secondary" onClick={onApply}>
            {applyLabel}
          </Button>
        )}
      </div>

      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
};

const SuggestionList = ({ items, emptyMessage }) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (normalizedItems.length === 0) {
    return <p className="text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="grid gap-2">
      {normalizedItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="font-black text-violet-600">•</span>

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const CompanyJobPostAssistantCard = ({
  control,
  getValues,
  setValue,
  availability,
}) => {
  const formValues = useWatch({
    control,
  });

  const [suggestions, setSuggestions] = useState(null);

  const suggestionsGenerated = Boolean(suggestions);

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setUsage(availability?.usage || null);

    setRuntimeBlockReason(null);
  }, [availability]);

  const aiDraft = useMemo(() => {
    return buildAiJobDraft(formValues || {});
  }, [formValues]);

  const hasMeaningfulDraft = useMemo(() => {
    return hasMeaningfulJobDraft(aiDraft);
  }, [aiDraft]);

  const dailyLimitReached =
    runtimeBlockReason === "daily_limit" ||
    availability?.blockReason === "daily_limit" ||
    Boolean(usage && usage.remaining <= 0);

  const canGenerate =
    availability?.canGenerate === true &&
    hasMeaningfulDraft &&
    !suggestionsGenerated &&
    !dailyLimitReached &&
    !isGenerating;

  const setJobFormValue = (fieldName, value) => {
    setValue(fieldName, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const applyTitle = () => {
    if (!suggestions?.improvedTitle) {
      return;
    }

    setJobFormValue("title", suggestions.improvedTitle);

    setSuccessMessage("AI title suggestion applied to the form.");
  };

  const applyDescription = () => {
    if (!suggestions?.improvedDescription) {
      return;
    }

    setJobFormValue("description", suggestions.improvedDescription);

    setSuccessMessage("AI description suggestion applied to the form.");
  };

  const applyResponsibilities = () => {
    const items = suggestions?.improvedResponsibilities;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    setJobFormValue("responsibilitiesText", items.join("\n"));

    setSuccessMessage("AI responsibility suggestions applied to the form.");
  };

  const applyRequirements = () => {
    const items = suggestions?.improvedRequirements;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    setJobFormValue("requirementsText", items.join("\n"));

    setSuccessMessage("AI requirement suggestions applied to the form.");
  };

  const applySkills = () => {
    const items = suggestions?.recommendedSkills;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const mergedSkills = mergeSkills(getValues("skillsText"), items);

    setJobFormValue("skillsText", mergedSkills);

    setSuccessMessage("AI skill suggestions merged into the form.");
  };

  const applyAllSuggestions = () => {
    if (!suggestions) {
      return;
    }

    if (suggestions.improvedTitle) {
      setJobFormValue("title", suggestions.improvedTitle);
    }

    if (suggestions.improvedDescription) {
      setJobFormValue("description", suggestions.improvedDescription);
    }

    if (suggestions.improvedResponsibilities?.length > 0) {
      setJobFormValue(
        "responsibilitiesText",
        suggestions.improvedResponsibilities.join("\n"),
      );
    }

    if (suggestions.improvedRequirements?.length > 0) {
      setJobFormValue(
        "requirementsText",
        suggestions.improvedRequirements.join("\n"),
      );
    }

    if (suggestions.recommendedSkills?.length > 0) {
      setJobFormValue(
        "skillsText",
        mergeSkills(getValues("skillsText"), suggestions.recommendedSkills),
      );
    }

    setSuccessMessage(
      "All available AI suggestions were applied to the form. Review them before saving the job.",
    );
  };

  const handleGenerate = async () => {
    const isAllowed =
      availability?.canGenerate === true &&
      hasMeaningfulDraft &&
      !suggestionsGenerated &&
      !dailyLimitReached &&
      !isGenerating;

    /*
     * Protect against programmatic
     * generation while unavailable.
     */
    if (!isAllowed) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await generateJobPostAssistantSuggestions(aiDraft);

      setSuggestions(result.data.suggestions);

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
    } finally {
      setIsGenerating(false);
    }
  };

  const statusLabel = (() => {
    if (suggestionsGenerated) {
      return "Suggestions generated";
    }

    if (dailyLimitReached) {
      return "Limit reached";
    }

    if (!hasMeaningfulDraft) {
      return "Add draft details";
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
            <AiBadge>AI Job Post Assistant</AiBadge>

            <h2 className="mt-3 text-xl font-black text-slate-950">
              Improve the current job draft
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Generate clearer title, description, responsibilities,
              requirements, and skill suggestions from the information already
              entered below.
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Suggestions are never saved or applied automatically. Review and
              apply only the changes you want.
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

        {!hasMeaningfulDraft && !dailyLimitReached && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Start the job draft first
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add a job title, description, responsibility, requirement, or
              skill before generating suggestions.
            </p>

            <Button
              type="button"
              variant="ai"
              fullWidth
              className="mt-4"
              disabled
            >
              Add draft details
            </Button>
          </div>
        )}

        {dailyLimitReached && (
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-950">
              Daily AI limit reached
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your company account has used all AI Job Post Assistant requests
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

        {hasMeaningfulDraft && !dailyLimitReached && (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            {suggestionsGenerated ? (
              <>
                <p className="text-sm font-black text-slate-950">
                  Suggestions generated
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  AI suggestions have already been generated for this job draft.
                  Review and apply the suggestions below before saving the job.
                </p>

                <Button
                  type="button"
                  variant="ai"
                  fullWidth
                  className="mt-4"
                  disabled
                >
                  Suggestions generated
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-slate-950">
                  Review the current form draft
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  AI will use only the current unsaved job-form values. It will
                  not publish or update the job.
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
                    ? "Generating job post suggestions..."
                    : "Generate AI suggestions"}
                </Button>
              </>
            )}
          </div>
        )}

        {suggestions && (
          <>
            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="job-post-assistant-results"
              className="w-full rounded-2xl border border-white/80 bg-white/80 p-4 text-left transition hover:bg-white"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                    Suggestions ready
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {isResultOpen ? "Hide suggestions" : "Review suggestions"}
                  </p>
                </div>

                <span className="text-lg font-black text-violet-700">
                  {isResultOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            <div
              id="job-post-assistant-results"
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
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ai"
                      onClick={applyAllSuggestions}
                    >
                      Apply all suggestions
                    </Button>
                  </div>

                  <SuggestionBlock
                    title="Improved title"
                    onApply={suggestions.improvedTitle ? applyTitle : null}
                    applyLabel="Apply title"
                  >
                    <p className="font-bold text-slate-900">
                      {suggestions.improvedTitle ||
                        "No title suggestion was returned."}
                    </p>
                  </SuggestionBlock>

                  <SuggestionBlock
                    title="Improved description"
                    onApply={
                      suggestions.improvedDescription ? applyDescription : null
                    }
                    applyLabel="Apply description"
                  >
                    <p className="whitespace-pre-line">
                      {suggestions.improvedDescription ||
                        "No description suggestion was returned."}
                    </p>
                  </SuggestionBlock>

                  <SuggestionBlock
                    title="Responsibilities"
                    onApply={
                      suggestions.improvedResponsibilities?.length > 0
                        ? applyResponsibilities
                        : null
                    }
                    applyLabel="Apply responsibilities"
                  >
                    <SuggestionList
                      items={suggestions.improvedResponsibilities}
                      emptyMessage="No responsibility suggestions were returned."
                    />
                  </SuggestionBlock>

                  <SuggestionBlock
                    title="Requirements"
                    onApply={
                      suggestions.improvedRequirements?.length > 0
                        ? applyRequirements
                        : null
                    }
                    applyLabel="Apply requirements"
                  >
                    <SuggestionList
                      items={suggestions.improvedRequirements}
                      emptyMessage="No requirement suggestions were returned."
                    />
                  </SuggestionBlock>

                  <SuggestionBlock
                    title="Recommended skills"
                    onApply={
                      suggestions.recommendedSkills?.length > 0
                        ? applySkills
                        : null
                    }
                    applyLabel="Merge skills"
                  >
                    <SuggestionList
                      items={suggestions.recommendedSkills}
                      emptyMessage="No additional skill suggestions were returned."
                    />
                  </SuggestionBlock>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <SuggestionBlock title="Quality notes">
                      <SuggestionList
                        items={suggestions.qualityNotes}
                        emptyMessage="No quality notes were returned."
                      />
                    </SuggestionBlock>

                    <SuggestionBlock title="Missing information">
                      <SuggestionList
                        items={suggestions.missingInformation}
                        emptyMessage="No missing information was identified."
                      />
                    </SuggestionBlock>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Before saving
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Review applied text for accuracy, company tone, realistic
                      requirements, compensation, and employment-law compliance.
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

export default CompanyJobPostAssistantCard;
