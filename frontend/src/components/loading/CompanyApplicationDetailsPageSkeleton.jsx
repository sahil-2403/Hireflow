import { Card, CardBody } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const InformationCardSkeleton = ({
  className = "",
  heightClassName = "h-72",
}) => {
  return (
    <Card className={className}>
      <CardBody className="p-4 sm:p-5">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-40 max-w-full" />

            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-16" />

              <Skeleton className="mt-2 h-4 w-28 max-w-full" />
            </div>
          ))}
        </div>

        <Skeleton
          className={["mt-5 w-full rounded-xl", heightClassName].join(" ")}
        />
      </CardBody>
    </Card>
  );
};

const CompanyApplicationDetailsPageSkeleton = () => {
  return (
    <div className="grid gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading application details</span>

      <Skeleton className="h-9 w-40 rounded-xl" />

      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-44 max-w-full" />

                <Skeleton className="mt-2 h-4 w-80 max-w-full" />

                <Skeleton className="mt-2 h-3 w-64 max-w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-11 w-full rounded-xl sm:w-32" />

              <Skeleton className="h-11 w-full rounded-xl sm:w-28" />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({
          length: 2,
        }).map((_, index) => (
          <section
            key={index}
            className="rounded-2xl border border-violet-200 bg-white p-4 sm:p-5"
          >
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-violet-200/60" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-48 max-w-full" />

                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            </div>

            <Skeleton className="mt-5 h-6 w-24 rounded-full" />

            <div className="mt-5 flex justify-end">
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </section>
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-12">
        <InformationCardSkeleton
          className="order-2 xl:order-0 xl:col-span-5"
          heightClassName="h-28"
        />

        <InformationCardSkeleton
          className="order-3 xl:order-0 xl:col-span-4"
          heightClassName="h-24"
        />

        <Card className="order-1 xl:order-0 xl:col-span-3">
          <CardBody className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />

              <div className="flex-1">
                <Skeleton className="h-5 w-36" />

                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            </div>

            <Skeleton className="mt-5 h-20 w-full rounded-xl" />

            <Skeleton className="mt-5 h-16 w-full rounded-xl" />

            <Skeleton className="mt-3 h-11 w-full rounded-xl" />

            <div className="mt-6 border-t border-slate-100 pt-5">
              <Skeleton className="h-5 w-28" />

              <div className="mt-4 grid gap-5">
                {Array.from({
                  length: 3,
                }).map((_, index) => (
                  <div key={index} className="pl-6">
                    <Skeleton className="h-6 w-24 rounded-full" />

                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <InformationCardSkeleton
          className="order-4 xl:order-0 xl:col-span-5"
          heightClassName="h-64"
        />

        <InformationCardSkeleton
          className="order-5 xl:order-0 xl:col-span-7"
          heightClassName="h-64"
        />

        <InformationCardSkeleton
          className="order-6 xl:order-0 xl:col-span-12"
          heightClassName="h-20"
        />
      </section>
    </div>
  );
};

export default CompanyApplicationDetailsPageSkeleton;
