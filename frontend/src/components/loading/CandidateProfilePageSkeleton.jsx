import { Card, CardBody, CardHeader } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const FieldSkeleton = ({ textarea = false }) => {
  return (
    <div>
      <Skeleton className="h-4 w-24" />

      <Skeleton
        className={["mt-2 w-full rounded-xl", textarea ? "h-28" : "h-11"].join(
          " ",
        )}
      />

      <Skeleton className="mt-2 h-3 w-44 max-w-full" />
    </div>
  );
};

const HeaderSkeleton = () => {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1">
        <Skeleton className="h-5 w-40 max-w-full" />

        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
    </div>
  );
};

const CandidateProfilePageSkeleton = () => {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading candidate profile</span>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-stretch">
        <Card className="h-full">
          <CardBody>
            <Skeleton className="h-4 w-20" />

            <div className="mt-3 flex min-w-0 items-start gap-4">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-40 max-w-full" />

                <Skeleton className="mt-2 h-4 w-44 max-w-full" />

                <Skeleton className="mt-2 h-4 w-48 max-w-full" />
              </div>
            </div>

            <Skeleton className="mt-5 h-20 w-full rounded-xl" />

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Skeleton className="h-4 w-24" />

              <Skeleton className="mt-2 h-3 w-64 max-w-full" />

              <Skeleton className="mt-4 h-11 w-full rounded-xl" />

              <Skeleton className="mt-2 h-3 w-52 max-w-full" />

              <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
                <Skeleton className="h-9 w-full rounded-xl" />

                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <HeaderSkeleton />
          </CardHeader>

          <CardBody className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <HeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <FieldSkeleton />

              <Skeleton className="h-20 w-full rounded-xl" />
            </div>

            <FieldSkeleton textarea />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <HeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Skeleton className="h-32 w-full rounded-xl" />

              <Skeleton className="h-32 w-full rounded-xl" />
            </div>

            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <HeaderSkeleton />
        </CardHeader>

        <CardBody>
          <div className="grid gap-4 lg:grid-cols-3">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </CardBody>
      </Card>

      <Card className="sticky bottom-3 z-20 border-slate-200 bg-white/90 shadow-lg shadow-slate-200/50 backdrop-blur">
        <CardBody className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <Skeleton className="h-4 w-72 max-w-full" />

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Skeleton className="h-11 w-full rounded-xl sm:w-24" />

            <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CandidateProfilePageSkeleton;
