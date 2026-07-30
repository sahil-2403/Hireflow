import { ChevronDown, Target } from "lucide-react";

import MatchScoreBadge from "../application/MatchScoreBadge";
import SkillMatchList from "../application/SkillMatchList";

import { Card, CardBody } from "../ui/Card";

import Pill from "../ui/Pill";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const CandidateJobMatchCard = ({
  status,
  matchData,
  errorMessage,
  onRetry,
}) => {
  const match = matchData?.match;

  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Target className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-7 text-slate-950">
                Profile fit for this role
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                See how well your profile matches the job requirements.
              </p>
            </div>
          </div>

          {status === "success" && match && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <MatchScoreBadge match={match} size="lg" />

              <Pill variant="slate" size="sm" className="normal-case">
                {match.confidenceLevel
                  ? `${match.confidenceLevel} confidence`
                  : "Confidence unavailable"}
              </Pill>
            </div>
          )}
        </header>

        {status === "loading" && (
          <div aria-busy="true" aria-live="polite" className="mt-5 grid gap-4">
            <span className="sr-only">Calculating your job match</span>

            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-full" />

              <Skeleton className="h-7 w-28 rounded-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50/70 p-4">
                <Skeleton className="h-4 w-28" />

                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/70 p-4">
                <Skeleton className="h-4 w-28" />

                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-5">
            <SectionError
              compact
              title="Could not calculate match"
              message={errorMessage}
              onRetry={onRetry}
            />
          </div>
        )}

        {status === "success" && match && (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50/70 p-4">
                <SkillMatchList
                  title="Matched skills"
                  skills={match.matchedSkills || []}
                  emptyMessage="No matched skills yet."
                  variant="matched"
                  limit={5}
                />
              </div>

              <div className="rounded-xl bg-slate-50/70 p-4">
                <SkillMatchList
                  title="Missing skills"
                  skills={match.missingSkills || []}
                  emptyMessage="No missing skills listed."
                  variant="missing"
                  limit={5}
                />
              </div>
            </div>

            {match.reasons?.length > 0 && (
              <details className="group rounded-xl border border-slate-200 bg-slate-50/70">
                <summary
                  className={[
                    "flex min-h-11",
                    "cursor-pointer",
                    "list-none",
                    "items-center",
                    "justify-between",
                    "gap-3 px-4 py-3",
                    "text-sm font-medium",
                    "text-slate-700",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",

                    "[&::-webkit-details-marker]:hidden",
                  ].join(" ")}
                >
                  Why this score
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <ul className="grid gap-2 border-t border-slate-200 px-4 py-3">
                  {match.reasons.slice(0, 3).map((reason, index) => (
                    <li
                      key={`${reason}-${index}`}
                      className="text-sm leading-6 text-slate-600"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CandidateJobMatchCard;
