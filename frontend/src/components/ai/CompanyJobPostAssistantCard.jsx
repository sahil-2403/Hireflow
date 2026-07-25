import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useWatch } from "react-hook-form";

import { generateJobPostAssistantSuggestions } from "../../api/ai.api";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";

import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Pill from "../ui/Pill";

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
  className = "",
}) => {
  return (
    <section
      className={[
        "rounded-xl border",
        "border-violet-100",
        "bg-white p-4",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-sm font-semibold leading-6 text-slate-950">
          {title}
        </h3>

        {onApply && (
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={onApply}
            className="shrink-0 text-blue-700"
          >
            {applyLabel}
          </Button>
        )}
      </div>

      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
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
          <span aria-hidden="true" className="font-semibold text-violet-600">
            •
          </span>

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const SkillsSuggestion = ({ skills }) => {
  const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : [];

  if (normalizedSkills.length === 0) {
    return (
      <p className="text-slate-500">
        No additional skill suggestions were returned.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {normalizedSkills.map((skill, index) => (
        <Pill key={`${skill}-${index}`} variant="violet" size="sm">
          {skill}
        </Pill>
      ))}
    </div>
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

  const [usage, setUsage] = useState(null);

  const [runtimeBlockReason, setRuntimeBlockReason] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isResultOpen, setIsResultOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

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
    !suggestions &&
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

    notify.success("AI title suggestion applied.");
  };

  const applyDescription = () => {
    if (!suggestions?.improvedDescription) {
      return;
    }

    setJobFormValue("description", suggestions.improvedDescription);

    notify.success("AI description suggestion applied.");
  };

  const applyResponsibilities = () => {
    const items = suggestions?.improvedResponsibilities;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    setJobFormValue("responsibilitiesText", items.join("\n"));

    notify.success("AI responsibility suggestions applied.");
  };

  const applyRequirements = () => {
    const items = suggestions?.improvedRequirements;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    setJobFormValue("requirementsText", items.join("\n"));

    notify.success("AI requirement suggestions applied.");
  };

  const applySkills = () => {
    const items = suggestions?.recommendedSkills;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    setJobFormValue(
      "skillsText",

      mergeSkills(getValues("skillsText"), items),
    );

    notify.success("AI skill suggestions merged into the form.");
  };

  const applyAllSuggestions = () => {
    if (!suggestions) {
      return;
    }

    if (suggestions.improvedTitle) {
      setJobFormValue("title", suggestions.improvedTitle);
    }

    if (suggestions.improvedDescription) {
      setJobFormValue(
        "description",

        suggestions.improvedDescription,
      );
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

        mergeSkills(
          getValues("skillsText"),

          suggestions.recommendedSkills,
        ),
      );
    }

    notify.success(
      "All available AI suggestions were applied. Review them before saving the job.",
    );
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");

      const result = await generateJobPostAssistantSuggestions(aiDraft);

      setSuggestions(result.data.suggestions);

      setUsage(result.data.usage);

      setRuntimeBlockReason(null);

      setIsResultOpen(true);

      notify.success(result.message || "AI job-post suggestions generated.");
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

  const generateButtonLabel = (() => {
    if (isGenerating) {
      return "Generating suggestions...";
    }

    if (dailyLimitReached) {
      return "Daily AI limit reached";
    }

    if (!hasMeaningfulDraft) {
      return "Add draft details first";
    }

    if (availability?.canGenerate !== true) {
      return "AI assistant unavailable";
    }

    return "Generate AI suggestions";
  })();

  return (
    <AiCard>
      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-col items-start gap-4">
            <div className="flex w-full gap-5 justify-items-center place-items-center">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold leading-7 text-slate-950">
                AI Job Post Assistant
              </h2>
            </div>

            <div className="min-w-0">
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Improve your job title, description, responsibilities,
                requirements, and skills using the current unsaved form values.
              </p>

              <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-700"
                  aria-hidden="true"
                />

                <span>
                  Suggestions are never saved or applied automatically. Review
                  and apply only the changes you want.
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-2 h-full lg:min-w-72 lg:justify-items-end">
            {suggestions ? (
              <Button
                type="button"
                variant="ai"
                onClick={applyAllSuggestions}
                className="h-fit"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Apply all suggestions
              </Button>
            ) : (
              <Button
                type="button"
                variant="ai"
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="h-fit"
              >
                {isGenerating && (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}

                {generateButtonLabel}
              </Button>
            )}

            <AiUsageStatus
              usage={usage}
              className="justify-start sm:justify-end"
            />
          </div>
        </div>

        {errorMessage && (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        )}
      </div>

      {suggestions && (
        <div className="border-t border-violet-100 bg-violet-50/30 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              aria-expanded={isResultOpen}
              aria-controls="job-post-assistant-results"
              onClick={() => setIsResultOpen((currentValue) => !currentValue)}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-4 rounded-xl border border-violet-100 bg-white px-4 py-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <span className="flex min-w-0 items-start gap-3">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-700"
                  aria-hidden="true"
                />

                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-5 text-slate-950">
                    AI-generated suggestions
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Review and edit every suggestion before updating the job.
                  </span>
                </span>
              </span>

              <div className="flex gap-3">
                <Pill variant="emerald" size="sm">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Suggestions ready
                </Pill>

                {isResultOpen ? (
                  <ChevronUp
                    className="h-5 w-5 shrink-0 text-violet-700"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-violet-700"
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          </div>

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
              <div className="grid gap-4 pt-4 lg:grid-cols-2">
                <SuggestionBlock
                  title="Improved job title"
                  onApply={suggestions.improvedTitle ? applyTitle : null}
                  applyLabel="Apply title"
                >
                  <p className="font-medium text-slate-900">
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
                  title="Responsibility suggestions"
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
                  title="Requirement suggestions"
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
                  className="lg:col-span-2"
                >
                  <SkillsSuggestion skills={suggestions.recommendedSkills} />
                </SuggestionBlock>

                <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
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

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 lg:col-span-2">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-600"
                    aria-hidden="true"
                  />

                  <p>
                    Before saving, review applied text for accuracy, company
                    tone, realistic requirements, compensation, and
                    employment-law compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AiCard>
  );
};

export default CompanyJobPostAssistantCard;
