import {
  BriefcaseBusiness,
  CalendarClock,
  LoaderCircle,
  ScanSearch,
  Trophy,
} from "lucide-react";

import { Card, CardBody } from "../ui/Card";

import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const SUMMARY_METRICS = [
  {
    key: "total",
    icon: BriefcaseBusiness,
    label: "Total applications",
    tone: "bg-blue-50 text-blue-700",
    getValue: (summary) => summary?.totalApplications ?? 0,
  },
  {
    key: "screening",
    icon: ScanSearch,
    label: "Screening",
    tone: "bg-slate-100 text-slate-700",
    getValue: (summary) => summary?.statusCounts?.screening ?? 0,
  },
  {
    key: "interview",
    icon: CalendarClock,
    label: "Interviews",
    tone: "bg-emerald-50 text-emerald-700",
    getValue: (summary) => summary?.statusCounts?.interview ?? 0,
  },
  {
    key: "offers",
    icon: Trophy,
    label: "Offers / hired",
    tone: "bg-amber-50 text-amber-700",
    getValue: (summary) =>
      (summary?.statusCounts?.offer ?? 0) + (summary?.statusCounts?.hired ?? 0),
  },
];

const SummarySkeleton = () => {
  return (
    <Card>
      <CardBody>
        <div>
          <Skeleton className="h-6 w-48" />

          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>

        <div
          aria-busy="true"
          aria-live="polite"
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <span className="sr-only">Loading application overview</span>

          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50/70 p-3.5"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-12" />

                <Skeleton className="mt-2 h-4 w-28 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateApplicationsSummary = ({
  status,
  summary,
  errorMessage,
  onRetry,
}) => {
  const hasLoadedSummary = summary !== null;

  const isInitialLoading = status === "loading" && !hasLoadedSummary;

  const isRefreshing = status === "loading" && hasLoadedSummary;

  if (isInitialLoading) {
    return <SummarySkeleton />;
  }

  if (status === "error" && !hasLoadedSummary) {
    return (
      <Card>
        <CardBody>
          <SectionError
            title="Could not load application overview"
            message={errorMessage}
            onRetry={onRetry}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-7 text-slate-950">
              Application overview
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Review your submitted applications and active hiring stages.
            </p>
          </div>

          {isRefreshing && (
            <p
              role="status"
              className="inline-flex shrink-0 items-center gap-2 text-xs leading-5 text-slate-500"
            >
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Updating overview
            </p>
          )}
        </header>

        {status === "error" && hasLoadedSummary && (
          <div className="mt-4">
            <SectionError
              compact
              title="Could not refresh application overview"
              message={[
                errorMessage,
                "Previously loaded totals are still shown.",
              ]
                .filter(Boolean)
                .join(" ")}
              onRetry={onRetry}
            />
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUMMARY_METRICS.map((metric) => {
            const MetricIcon = metric.icon;

            return (
              <article
                key={metric.key}
                className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50/70 p-3.5"
              >
                <div
                  className={[
                    "grid h-9 w-9",
                    "shrink-0 place-items-center",
                    "rounded-xl",
                    metric.tone,
                  ].join(" ")}
                >
                  <MetricIcon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-7 text-slate-950">
                    {metric.getValue(summary)}
                  </p>

                  <h3 className="text-sm font-medium leading-5 text-slate-600">
                    {metric.label}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default CandidateApplicationsSummary;
