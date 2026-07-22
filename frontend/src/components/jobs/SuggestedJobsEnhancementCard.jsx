import { FileText, Sparkles } from "lucide-react";

import { Link } from "react-router-dom";

import AiBadge from "../ai/AiBadge";
import AiCard from "../ai/AiCard";

import Button from "../ui/Button";
import Pill from "../ui/Pill";

const SuggestedJobsEnhancementCard = ({ enhancement }) => {
  const isEnabled = enhancement?.enabled === true;

  return (
    <AiCard>
      <div className="grid min-w-0 gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <AiBadge>AI-enhanced Suggested Jobs</AiBadge>

          <h2 className="mt-3 text-lg font-semibold leading-7 text-slate-950">
            {isEnabled
              ? "Resume Insights are improving your suggestions"
              : "Add resume information to your suggestions"}
          </h2>

          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            {isEnabled
              ? "HireFlow combines your candidate profile with stored AI Resume Insights before the deterministic match engine ranks relevant jobs."
              : "These suggestions currently use your candidate profile. Generate Resume Insights to also consider resume skills, technologies, projects, and target roles."}
          </p>

          {isEnabled && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Browsing these results does not create another AI request or
              consume additional daily usage.
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:w-56">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-white/70 px-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {isEnabled ? (
                <Sparkles
                  className="h-4 w-4 shrink-0 text-violet-600"
                  aria-hidden="true"
                />
              ) : (
                <FileText
                  className="h-4 w-4 shrink-0 text-slate-500"
                  aria-hidden="true"
                />
              )}

              <span className="text-xs font-medium text-slate-600">
                Suggestion mode
              </span>
            </div>

            <Pill
              variant={isEnabled ? "violet" : "slate"}
              size="xs"
              className="shrink-0 normal-case"
            >
              {isEnabled ? "Profile + resume" : "Profile only"}
            </Pill>
          </div>

          <Button
            as={Link}
            to="/candidate/resume"
            variant={isEnabled ? "secondary" : "ai"}
            fullWidth
          >
            {isEnabled ? "Review Resume Insights" : "Generate Resume Insights"}
          </Button>
        </div>
      </div>
    </AiCard>
  );
};

export default SuggestedJobsEnhancementCard;
