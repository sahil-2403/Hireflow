import Skeleton from "../ui/Skeleton";

import { Card, CardBody } from "../ui/Card";

const CandidateResumePageSkeleton = () => {
  return (
    <div className="grid gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading resume details</span>

      <Skeleton className="h-32 w-full rounded-3xl" />

      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-40" />

              <Skeleton className="mt-2 h-4 w-80 max-w-full" />
            </div>

            <Skeleton className="h-10 w-full sm:w-32" />
          </div>

          <Skeleton className="mt-5 h-5 w-36" />

          <Skeleton className="mt-2 h-4 w-64 max-w-full" />

          <Skeleton className="mt-4 h-24 w-full rounded-2xl" />

          <div className="mt-5 flex justify-end">
            <Skeleton className="h-10 w-full sm:w-36" />
          </div>
        </CardBody>
      </Card>

      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
        <div className="border-b border-violet-100 bg-violet-50/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-violet-200/70" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-36 bg-violet-200/70" />
              <Skeleton className="mt-3 h-5 w-64 max-w-full" />
              <Skeleton className="mt-2 h-4 w-full max-w-xl" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>
    </div>
  );
};

export default CandidateResumePageSkeleton;
