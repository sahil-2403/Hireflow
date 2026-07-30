import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const PublicJobCardSkeleton = () => {
  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-52 max-w-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>

            <Skeleton className="mt-2 h-3.5 w-36" />

            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <Skeleton className="mt-4 h-4 w-32" />

            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const PublicJobsListSkeleton = ({ count = 4 }) => {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-4">
      <span className="sr-only">Loading jobs</span>

      {Array.from({
        length: count,
      }).map((_, index) => (
        <PublicJobCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default PublicJobsListSkeleton;
