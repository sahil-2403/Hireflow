import { Card, CardBody, CardFooter, CardHeader } from "../ui/Card";

import Skeleton from "../ui/Skeleton";

const FormFieldSkeleton = ({ fullWidth = false, textarea = false }) => {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <Skeleton className="h-4 w-24" />

      <Skeleton
        className={["mt-2 w-full rounded-xl", textarea ? "h-32" : "h-11"].join(
          " ",
        )}
      />

      {(textarea || fullWidth) && (
        <Skeleton className="mt-2 h-3 w-52 max-w-full" />
      )}
    </div>
  );
};

const CompanyProfilePageSkeleton = () => {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading company profile</span>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-stretch">
        <Card className="h-full">
          <CardBody className="flex h-full flex-col">
            <div className="flex min-w-0 items-start gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-48 max-w-full" />

                <Skeleton className="mt-2 h-4 w-52 max-w-full" />

                <Skeleton className="mt-2 h-4 w-28" />
              </div>
            </div>

            <div className="mt-5">
              <Skeleton className="h-4 w-full" />

              <Skeleton className="mt-2 h-4 w-11/12" />

              <Skeleton className="mt-2 h-4 w-8/12" />
            </div>

            <Skeleton className="mt-5 h-11 w-full rounded-lg sm:w-40" />

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Skeleton className="h-5 w-28" />

              <Skeleton className="mt-2 h-4 w-72 max-w-full" />

              <div className="mt-4">
                <Skeleton className="h-4 w-20" />

                <Skeleton className="mt-2 h-11 w-full rounded-xl" />

                <Skeleton className="mt-2 h-3 w-48 max-w-full" />
              </div>

              <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
                <Skeleton className="h-11 w-full rounded-lg" />

                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <Skeleton className="h-5 w-48 max-w-full" />

            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </CardHeader>

          <CardBody className="flex-1">
            <div className="grid gap-5 md:grid-cols-2">
              <FormFieldSkeleton fullWidth />

              <FormFieldSkeleton />

              <FormFieldSkeleton />

              <FormFieldSkeleton fullWidth />

              <FormFieldSkeleton fullWidth />

              <FormFieldSkeleton fullWidth textarea />
            </div>
          </CardBody>

          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Skeleton className="h-11 w-full rounded-lg sm:w-24" />

            <Skeleton className="h-11 w-full rounded-lg sm:w-36" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CompanyProfilePageSkeleton;
