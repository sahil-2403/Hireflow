import { Card, CardBody, CardFooter, CardHeader } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const ProfileFieldSkeleton = () => {
  return (
    <div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-11 w-full rounded-xl" />
    </div>
  );
};

const CompanyMyProfilePageSkeleton = () => {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your profile</span>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start">
        <Card>
          <CardBody>
            <Skeleton className="h-4 w-20" />

            <div className="mt-3 flex min-w-0 items-start gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-40 max-w-full" />
                <Skeleton className="mt-2 h-4 w-28" />
                <Skeleton className="mt-2 h-4 w-48 max-w-full" />
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
              <Skeleton className="mt-2 h-4 w-52 max-w-full" />

              <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-5 w-72 max-w-full" />
            <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          </CardHeader>

          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProfileFieldSkeleton key={index} />
              ))}
            </div>
          </CardBody>

          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Skeleton className="h-11 w-full rounded-xl sm:w-24" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-32" />
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-5 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </CardHeader>

        <CardBody>
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex min-w-0 items-center gap-3 bg-white p-4"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanyMyProfilePageSkeleton;
