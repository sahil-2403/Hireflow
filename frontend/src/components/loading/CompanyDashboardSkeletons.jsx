import Skeleton from "../ui/Skeleton";

const MetricSkeleton = ({ compact = false }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-24" />

          <Skeleton
            className={["mt-3", compact ? "h-6 w-14" : "h-8 w-20"].join(" ")}
          />

          {!compact && <Skeleton className="mt-3 h-3 w-36 max-w-full" />}
        </div>

        <Skeleton
          className={[
            "shrink-0 rounded-xl",
            compact ? "h-9 w-9" : "h-10 w-10",
          ].join(" ")}
        />
      </div>
    </div>
  );
};

const CompanyWorkspaceSkeleton = () => {
  return (
    <section
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-52 max-w-full" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
        </div>

        <Skeleton className="h-11 w-full sm:h-9 sm:w-32" />
      </div>
    </section>
  );
};

const CompanyMetricsSkeleton = () => {
  return (
    <div aria-hidden="true" className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <MetricSkeleton key={`primary-${index}`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <MetricSkeleton key={`secondary-${index}`} compact />
        ))}
      </div>
    </div>
  );
};

const RecentApplicationsSkeleton = () => {
  return (
    <section
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>

          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="divide-y divide-slate-100 p-4 sm:p-5">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-4 w-60 max-w-full" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>

            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export {
  CompanyMetricsSkeleton,
  CompanyWorkspaceSkeleton,
  RecentApplicationsSkeleton,
};
