import Skeleton from "../ui/Skeleton";

const CompanyApplicationJobSkeleton = () => {
  return (
    <div className="grid gap-5 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-56 max-w-full" />

          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <Skeleton className="mt-3 h-4 w-40" />

        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />

          <Skeleton className="h-6 w-16 rounded-full" />

          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full rounded-xl" />

        <Skeleton className="h-20 w-full rounded-xl" />

        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      <div className="border-t border-slate-100 pt-4 xl:border-t-0 xl:pt-0">
        <Skeleton className="h-10 w-full rounded-xl xl:w-36" />
      </div>
    </div>
  );
};

const CompanyApplicationJobsSkeleton = ({ count = 5 }) => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="divide-y divide-slate-100"
    >
      <span className="sr-only">Loading application groups</span>

      {Array.from({
        length: count,
      }).map((_, index) => (
        <CompanyApplicationJobSkeleton key={index} />
      ))}
    </div>
  );
};

export default CompanyApplicationJobsSkeleton;
