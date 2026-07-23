import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const CompanyJobFormPageSkeleton = () => {
  return (
    <div className="grid gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading job form</span>

      <Skeleton className="h-32 w-full rounded-3xl" />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <Card>
          <CardBody className="p-5 sm:p-6">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-36" />

                <Skeleton className="mt-2 h-4 w-80 max-w-full" />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Skeleton className="h-16 w-full rounded-xl" />

              <Skeleton className="h-40 w-full rounded-xl" />

              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-16 w-full rounded-xl" />

                <Skeleton className="h-16 w-full rounded-xl" />

                <Skeleton className="h-16 w-full rounded-xl" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-16 w-full rounded-xl" />

                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Skeleton className="h-6 w-64 max-w-full" />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-44 w-full rounded-xl" />

                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
          <div className="border-b border-violet-100 bg-violet-50/60 p-5">
            <Skeleton className="h-6 w-44 bg-violet-200/70" />

            <Skeleton className="mt-4 h-6 w-64 max-w-full" />

            <Skeleton className="mt-2 h-4 w-full" />
          </div>

          <div className="p-5">
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </section>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-72 max-w-full" />

          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 w-full rounded-xl sm:w-24" />

            <Skeleton className="h-11 w-full rounded-xl sm:w-32" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanyJobFormPageSkeleton;
