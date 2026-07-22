import Skeleton from "../ui/Skeleton";

const CompanyJobRowSkeleton = () => {
  return (
    <div className="grid gap-5 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.65fr)_auto] xl:items-center">
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

        <Skeleton className="mt-3 h-3 w-36" />
      </div>

      <div>
        <Skeleton className="h-3 w-16" />

        <Skeleton className="mt-2 h-4 w-24" />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:flex xl:border-t-0 xl:pt-0">
        <Skeleton className="col-span-2 h-9 w-full rounded-xl sm:col-auto sm:w-32" />

        <Skeleton className="h-9 w-full rounded-xl sm:w-20" />

        <Skeleton className="h-9 w-full rounded-xl sm:w-20" />
      </div>
    </div>
  );
};

const CompanyJobsListSkeleton = ({ count = 5 }) => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="divide-y divide-slate-100"
    >
      <span className="sr-only">Loading company jobs</span>

      {Array.from({
        length: count,
      }).map((_, index) => (
        <CompanyJobRowSkeleton key={index} />
      ))}
    </div>
  );
};

export default CompanyJobsListSkeleton;
