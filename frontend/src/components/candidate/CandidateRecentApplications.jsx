import { ArrowRight, BriefcaseBusiness } from "lucide-react";

import { Link } from "react-router-dom";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";

import CompanyLogo from "../common/CompanyLogo";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

import EmptyState from "../ui/EmptyState";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

import { formatShortDate } from "../../utils/formatDate";

const getApplicationId = (application) => {
  return application._id || application.id;
};

const getJobId = (application) => {
  if (typeof application.jobId === "string") {
    return application.jobId;
  }

  return application.jobId?._id || application.jobId?.id || null;
};

const getAppliedDate = (application) => {
  return application.appliedAt || application.createdAt;
};

const RecentApplicationsSkeleton = () => {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="border-b border-slate-100 p-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div key={index} className="flex gap-3 p-5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="mt-2 h-3 w-32" />
                <Skeleton className="mt-3 h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const RecentApplicationRow = ({ application }) => {
  const jobId = getJobId(application);

  return (
    <article className="grid min-w-0 gap-4 px-4 py-4  sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(140px,0.65fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <CompanyLogo
          company={application.companyId}
          name={application.companyId?.name || application.jobId?.title}
          size="sm"
        />

        <div className="min-w-0">
          <h3 className="wrap-break-word text-sm font-semibold leading-5 text-slate-950">
            {application.jobId?.title || "Job unavailable"}
          </h3>

          <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-500">
            {application.companyId?.name || "Company unavailable"}
          </p>

          <div className="mt-2 lg:hidden">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-5 text-slate-500">
            Applied on
          </p>

          <p className="text-sm font-medium leading-6 text-slate-700">
            {formatShortDate(getAppliedDate(application))}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
          <div className="hidden lg:block">
            <ApplicationStatusBadge status={application.status} />
          </div>

          {jobId && (
            <Button as={Link} to={`/jobs/${jobId}`} variant="ghost" size="sm">
              View job
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

const CandidateRecentApplications = ({
  status,
  applicationsData,
  errorMessage,
  onRetry,
}) => {
  if (status === "loading") {
    return <RecentApplicationsSkeleton />;
  }

  const applications = applicationsData?.applications ?? [];

  return (
    <Card>
      <CardBody className="p-0">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium leading-5 text-blue-600">
              Recent activity
            </p>

            <h2 className="text-xl font-semibold leading-7 text-slate-950">
              Recent applications
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Review the latest jobs you applied to and their current status.
            </p>
          </div>

          <Button
            as={Link}
            to="/candidate/applications"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            View all applications
          </Button>
        </header>

        {status === "error" && (
          <div className="p-5">
            <SectionError
              compact
              title="Could not load recent applications"
              message={errorMessage}
              onRetry={onRetry}
            />
          </div>
        )}

        {status === "success" && applications.length === 0 && (
          <div className="p-5">
            <EmptyState
              size="compact"
              icon={BriefcaseBusiness}
              title="No applications yet"
              description="Browse open jobs and submit your first application."
              action={
                <Button as={Link} to="/jobs">
                  Browse jobs
                </Button>
              }
            />
          </div>
        )}

        {status === "success" && applications.length > 0 && (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((application) => (
              <RecentApplicationRow
                key={getApplicationId(application)}
                application={application}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CandidateRecentApplications;
