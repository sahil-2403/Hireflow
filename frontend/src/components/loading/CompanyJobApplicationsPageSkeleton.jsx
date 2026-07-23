import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const CompanyJobApplicationsPageSkeleton = () => {
  return (
    <div className="grid gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading applicant pipeline</span>

      <Skeleton className="h-28 w-full rounded-2xl" />

      <Card>
        <CardBody className="p-0">
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 xl:grid-cols-7">
            {Array.from({
              length: 7,
            }).map((_, index) => (
              <div key={index} className="p-4">
                <Skeleton className="h-3 w-24" />

                <Skeleton className="mt-3 h-7 w-12" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({
          length: 2,
        }).map((_, index) => (
          <section
            key={index}
            className="rounded-2xl border border-violet-200 bg-white p-5"
          >
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-violet-200/60" />

              <div className="flex-1">
                <Skeleton className="h-5 w-48 max-w-full" />

                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            </div>

            <Skeleton className="mt-5 h-9 w-36 rounded-full" />

            <div className="mt-5 flex justify-end">
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </section>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="border-b border-slate-100 p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_220px_auto]">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="grid gap-4 p-5 xl:grid-cols-[88px_minmax(240px,1.2fr)_minmax(230px,0.8fr)_110px_120px_auto]"
              >
                <Skeleton className="h-9 w-20 rounded-lg" />

                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />

                  <div className="flex-1">
                    <Skeleton className="h-4 w-40" />

                    <Skeleton className="mt-2 h-3 w-56 max-w-full" />

                    <Skeleton className="mt-2 h-3 w-36" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                <Skeleton className="h-7 w-16 rounded-full" />

                <Skeleton className="h-4 w-24" />

                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-9 w-full rounded-xl" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanyJobApplicationsPageSkeleton;
