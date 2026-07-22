import {
  BriefcaseBusiness,
  CalendarClock,
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
    description: "Applications submitted from your candidate account.",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    key: "screening",
    icon: ScanSearch,
    label: "Screening",
    description: "Applications currently being reviewed.",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    key: "interview",
    icon: CalendarClock,
    label: "Interviews",
    description: "Applications that reached the interview stage.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "offers",
    icon: Trophy,
    label: "Offers / hired",
    description: "Applications with offer or hired status.",
    tone: "bg-amber-50 text-amber-700",
  },
];

const SummarySkeleton = () => {
  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-5 w-44" />

            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>

          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <Skeleton className="h-9 w-9 rounded-xl" />

              <Skeleton className="mt-4 h-7 w-14" />

              <Skeleton className="mt-2 h-4 w-28" />

              <Skeleton className="mt-2 h-3 w-full" />
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
  if (status === "loading") {
    return <SummarySkeleton />;
  }

  if (status === "error") {
    return (
      <Card>
        <CardBody className="p-4 sm:p-5">
          <SectionError
            compact
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
      <CardBody className="p-4 sm:p-5">
        <header>
          <p className="text-xs font-medium leading-5 text-blue-600">
            Application overview
          </p>

          <h2 className="text-xl font-semibold leading-7 text-slate-950">
            Your current progress
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            A compact summary of your submitted applications and active hiring
            stages.
          </p>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUMMARY_METRICS.map((metric) => {
            const MetricIcon = metric.icon;

            return (
              <article
                key={metric.key}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
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

                  <p className="text-2xl font-semibold leading-8 text-slate-950">
                    {summary[metric.key] ?? 0}
                  </p>
                </div>

                <h3 className="mt-3 text-sm font-semibold leading-5 text-slate-950">
                  {metric.label}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default CandidateApplicationsSummary;
