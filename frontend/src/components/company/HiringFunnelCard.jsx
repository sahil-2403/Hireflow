import { GitBranch } from "lucide-react";

import { Card, CardBody, CardHeader } from "../ui/Card";

import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const STATUS_LABELS = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offered",
  hired: "Hired",
  rejected: "Rejected",
};

const FunnelSkeleton = () => {
  return (
    <div aria-hidden="true" className="grid gap-4">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
};

const HiringFunnelCard = ({ status, funnelData, errorMessage, onRetry }) => {
  const totalApplications = funnelData?.totalApplications ?? 0;

  const funnel = funnelData?.funnel ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <GitBranch className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                Hiring funnel
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Applications across each hiring stage.
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold leading-7 text-slate-950">
              {totalApplications}
            </p>

            <p className="text-xs text-slate-500">total</p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {status === "loading" && <FunnelSkeleton />}

        {status === "error" && (
          <SectionError
            compact
            title="Could not load hiring funnel"
            message={errorMessage}
            onRetry={onRetry}
          />
        )}

        {status === "success" && funnel.length === 0 && (
          <p className="text-sm leading-6 text-slate-500">
            No hiring activity is available yet.
          </p>
        )}

        {status === "success" && funnel.length > 0 && (
          <div className="grid gap-4">
            {funnel.map((item) => {
              const percentage =
                totalApplications > 0
                  ? Math.round((item.count / totalApplications) * 100)
                  : 0;

              return (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-700">
                      {STATUS_LABELS[item.status] || item.status}
                    </p>

                    <p className="text-xs font-medium text-slate-500">
                      {item.count}
                      <span className="mx-1" aria-hidden="true">
                        ·
                      </span>
                      {percentage}%
                    </p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width]"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default HiringFunnelCard;
