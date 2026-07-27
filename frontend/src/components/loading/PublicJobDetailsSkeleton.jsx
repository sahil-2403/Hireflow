import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const PublicJobDetailsSkeleton = () => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto grid max-w-375 gap-5"
    >
      <span className="sr-only">Loading job details</span>

      <Skeleton className="h-9 w-32 rounded-xl" />

      <section className="border-b border-slate-200 pb-5 sm:pb-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4 min-[420px]:flex-row">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />

              <Skeleton className="mt-3 h-8 w-96 max-w-full" />

              <div className="mt-5 flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>

              <Skeleton className="mt-4 h-3 w-28" />
            </div>
          </div>

          <div className="lg:text-right">
            <Skeleton className="h-3 w-16 lg:ml-auto" />

            <Skeleton className="mt-2 h-6 w-40 lg:ml-auto" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <Card>
          <CardBody className="p-5 sm:p-6">
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
                <Skeleton className="h-4 w-11/12" />
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Skeleton className="h-6 w-36" />

              <div className="mt-4 grid gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </CardBody>
        </Card>

        <aside className="grid gap-5">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />

                <Skeleton className="h-5 w-40" />
              </div>

              <Skeleton className="mt-6 h-4 w-28" />

              <Skeleton className="mt-3 h-28 w-full rounded-xl" />

              <Skeleton className="mt-5 h-11 w-full rounded-xl" />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />

                <Skeleton className="h-5 w-36" />
              </div>

              <div className="mt-5 flex gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-36 max-w-full" />

                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              </div>

              <Skeleton className="mt-5 h-4 w-32" />

              <Skeleton className="mt-3 h-16 w-full" />
            </CardBody>
          </Card>
        </aside>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-48 max-w-full" />

              <Skeleton className="mt-2 h-4 w-80 max-w-full" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Skeleton className="h-10 w-32 rounded-full" />

            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />

            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </CardBody>
      </Card>

      <Card className="border-violet-200">
        <CardBody>
          <Skeleton className="h-7 w-28 rounded-full" />

          <Skeleton className="mt-4 h-5 w-52 max-w-full" />

          <Skeleton className="mt-2 h-4 w-96 max-w-full" />

          <div className="mt-5 rounded-xl bg-slate-50/70 p-4">
            <Skeleton className="h-4 w-52 max-w-full" />

            <Skeleton className="mt-3 h-4 w-full" />

            <Skeleton className="mt-5 h-11 w-48 max-w-full rounded-xl" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PublicJobDetailsSkeleton;
