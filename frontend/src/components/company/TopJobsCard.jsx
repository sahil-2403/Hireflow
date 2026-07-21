import { BriefcaseBusiness, MapPin } from "lucide-react";

import { Link } from "react-router-dom";

import Button from "../ui/Button";

import { Card, CardBody, CardHeader } from "../ui/Card";

import EmptyState from "../ui/EmptyState";
import Pill from "../ui/Pill";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const TopJobsSkeleton = () => {
  return (
    <div aria-hidden="true" className="divide-y divide-slate-100">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>

          <div className="grid justify-items-end gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

const TopJobsCard = ({ status, jobs, errorMessage, onRetry }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <BriefcaseBusiness className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                Top jobs
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Jobs with the most applications.
              </p>
            </div>
          </div>

          <Button as={Link} to="/company/jobs" variant="secondary" size="xs">
            View all
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {status === "loading" && <TopJobsSkeleton />}

        {status === "error" && (
          <SectionError
            compact
            title="Could not load top jobs"
            message={errorMessage}
            onRetry={onRetry}
          />
        )}

        {status === "success" && jobs.length === 0 && (
          <EmptyState
            size="compact"
            icon={BriefcaseBusiness}
            title="No jobs yet"
            description="Create a job to start receiving applications."
          />
        )}

        {status === "success" && jobs.length > 0 && (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const metadata = [job.location, job.status].filter(Boolean);

              return (
                <article key={job._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 wrap-break-word text-sm font-semibold text-slate-950">
                          {job.title}
                        </p>

                        {job.status && (
                          <Pill
                            variant={
                              job.status === "open" ? "emerald" : "slate"
                            }
                            size="xs"
                          >
                            {job.status}
                          </Pill>
                        )}
                      </div>

                      {metadata.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-slate-500">
                          {job.location && (
                            <>
                              <MapPin
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />

                              <span>{job.location}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-semibold leading-6 text-slate-950">
                          {job.applicationCount}
                        </p>

                        <p className="text-xs text-slate-500">applications</p>
                      </div>

                      <Button
                        as={Link}
                        to={`/company/applications/${job._id}`}
                        variant="secondary"
                        size="xs"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TopJobsCard;
