import { Card, CardBody, CardFooter, CardHeader } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const RecruiterRowSkeleton = () => {
  return (
    <div className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />

        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-36 max-w-full" />

          <Skeleton className="mt-2 h-3 w-44 max-w-full" />

          <Skeleton className="mt-2 h-3 w-32" />

          <Skeleton className="mt-2 h-3 w-56 max-w-full" />
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:contents">
        <Skeleton className="h-6 w-16 rounded-full" />

        <Skeleton className="h-11 w-full rounded-lg sm:h-9 sm:w-28" />
      </div>
    </div>
  );
};

const FormFieldSkeleton = ({ className = "" }) => {
  return (
    <div className={className}>
      <Skeleton className="h-4 w-20" />

      <Skeleton className="mt-2 h-11 w-full rounded-xl" />
    </div>
  );
};

const CompanyRecruitersPageSkeleton = () => {
  return (
    <div
      className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] xl:items-stretch"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading recruiters</span>

      <Card className="flex h-full flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-44" />

          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </CardHeader>

        <CardBody className="flex flex-1 flex-col">
          <div className="grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div key={index} className="px-2 py-2.5 text-center sm:px-3">
                <Skeleton className="mx-auto h-3 w-12" />

                <Skeleton className="mx-auto mt-2 h-5 w-6" />
              </div>
            ))}
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {Array.from({
              length: 2,
            }).map((_, index) => (
              <RecruiterRowSkeleton key={index} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="flex h-full flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-40" />

          <Skeleton className="mt-2 h-4 w-full" />

          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </CardHeader>

        <CardBody className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldSkeleton />

            <FormFieldSkeleton />

            <FormFieldSkeleton className="sm:col-span-2" />

            <FormFieldSkeleton />

            <FormFieldSkeleton />

            <FormFieldSkeleton className="sm:col-span-2" />

            <Skeleton className="h-16 w-full rounded-xl sm:col-span-2" />
          </div>
        </CardBody>

        <CardFooter>
          <Skeleton className="h-11 w-full rounded-lg" />
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanyRecruitersPageSkeleton;
