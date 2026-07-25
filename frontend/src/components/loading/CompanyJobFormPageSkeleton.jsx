import { Card, CardBody, CardHeader } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const FieldSkeleton = ({ className = "", textarea = false }) => {
  return (
    <div className={className}>
      <Skeleton className="h-4 w-24" />

      <Skeleton
        className={["mt-2 w-full rounded-xl", textarea ? "h-36" : "h-11"].join(
          " ",
        )}
      />

      <Skeleton className="mt-2 h-3 w-48 max-w-full" />
    </div>
  );
};

const SectionHeaderSkeleton = () => {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1">
        <Skeleton className="h-5 w-40 max-w-full" />

        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
    </div>
  );
};

const CompanyJobFormPageSkeleton = () => {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading job form</span>

      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-violet-200/70" />

            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-48 max-w-full" />

              <Skeleton className="mt-2 h-4 w-full max-w-2xl" />

              <Skeleton className="mt-2 h-4 w-10/12 max-w-xl" />
            </div>
          </div>

          <div className="grid gap-2 lg:min-w-72 lg:justify-items-end">
            <Skeleton className="h-11 w-full rounded-lg lg:w-64" />

            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <SectionHeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-4">
              <FieldSkeleton />

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldSkeleton />

                <FieldSkeleton />

                <FieldSkeleton />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldSkeleton />

                <FieldSkeleton />
              </div>
            </div>

            <FieldSkeleton textarea />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5 lg:grid-cols-2">
            <FieldSkeleton textarea />

            <FieldSkeleton textarea />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
              <FieldSkeleton />

              <FieldSkeleton />

              <FieldSkeleton />
            </div>

            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />

            <Skeleton className="mt-2 h-3 w-80 max-w-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Skeleton className="h-12 w-full rounded-lg sm:w-24" />

            <Skeleton className="h-12 w-full rounded-lg sm:w-36" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanyJobFormPageSkeleton;


<div className="flex w-full gap-5 justify-items-center place-items-center"></div>