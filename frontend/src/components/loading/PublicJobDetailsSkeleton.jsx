import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const PublicJobDetailsSkeleton = () => {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading job details</span>

      <Skeleton className="h-9 w-32 rounded-xl" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />

            <Skeleton className="mt-3 h-8 w-96 max-w-full" />

            <div className="mt-5 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          <div className="sm:text-right">
            <Skeleton className="h-3 w-16 sm:ml-auto" />
            <Skeleton className="mt-2 h-6 w-32 sm:ml-auto" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="lg:col-start-2">
          <CardBody>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-6 h-28 w-full rounded-xl" />
            <Skeleton className="mt-5 h-11 w-full rounded-xl" />
          </CardBody>
        </Card>

        <Card className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <CardBody>
            <Skeleton className="h-6 w-44" />

            <div className="mt-5 grid gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Skeleton className="h-6 w-40" />

              <div className="mt-4 grid gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-start-2">
          <Card>
            <CardBody>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-4 h-20 w-full rounded-xl" />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-4 h-16 w-full" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicJobDetailsSkeleton;
