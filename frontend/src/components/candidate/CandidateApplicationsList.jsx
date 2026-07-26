import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { Link } from "react-router-dom";

import { formatShortDate } from "../../utils/formatDate";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";

import CompanyLogo from "../common/CompanyLogo";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

import EmptyState from "../ui/EmptyState";
import SectionError from "../ui/SectionError";
import SelectInput from "../ui/SelectInput";
import Skeleton from "../ui/Skeleton";

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

const getApplicationCountLabel = (count) => {
  return `${count} ${count === 1 ? "application" : "applications"}`;
};

const ApplicationRowSkeleton = () => {
  return (
    <div className="grid min-w-0 gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-48 max-w-full" />

          <Skeleton className="mt-2 h-3 w-36 max-w-full" />

          <Skeleton className="mt-2 h-3 w-24 max-w-full" />

          <Skeleton className="mt-3 h-6 w-20 rounded-full lg:hidden" />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:border-t-0 lg:pt-0">
        <div>
          <Skeleton className="h-3 w-16" />

          <Skeleton className="mt-2 h-4 w-24" />
        </div>

        <Skeleton className="hidden h-7 w-20 rounded-full lg:block" />

        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};

const ApplicationsListSkeleton = () => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="divide-y divide-slate-100"
    >
      <span className="sr-only">Loading applications</span>

      {Array.from({
        length: 5,
      }).map((_, index) => (
        <ApplicationRowSkeleton key={index} />
      ))}
    </div>
  );
};

const CandidateApplicationRow = ({ application }) => {
  const jobId = getJobId(application);

  const jobTitle = application.jobId?.title || "Job unavailable";

  const companyName = application.companyId?.name || "Company unavailable";

  return (
    <article className="grid min-w-0 gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <CompanyLogo
          company={application.companyId}
          name={companyName || jobTitle}
          size="sm"
        />

        <div className="min-w-0">
          <h3 className="wrap-break-word text-sm font-semibold leading-5 text-slate-950">
            {jobTitle}
          </h3>

          <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-600">
            {companyName}
          </p>

          {application.jobId?.location && (
            <p className="mt-1 inline-flex items-start gap-1.5 text-xs leading-5 text-slate-500">
              <MapPin
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />

              <span className="wrap-break-word">
                {application.jobId.location}
              </span>
            </p>
          )}

          <div className="mt-3 lg:hidden">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:border-t-0 lg:pt-0">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium leading-5 text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Applied on
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
            {formatShortDate(getAppliedDate(application))}
          </p>
        </div>

        <div className="hidden lg:block">
          <ApplicationStatusBadge status={application.status} />
        </div>

        <div className="flex items-center justify-end">
          {jobId ? (
            <Button as={Link} to={`/jobs/${jobId}`} variant="ghost" size="sm">
              View job
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <span className="text-xs leading-5 text-slate-400">
              Job unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const ApplicationsPagination = ({
  pagination,
  disabled,
  onPreviousPage,
  onNextPage,
}) => {
  if (!pagination) {
    return null;
  }

  return (
    <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm leading-6 text-slate-600">
        Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
        {pagination.total} total
      </p>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !pagination.hasPreviousPage}
          onClick={onPreviousPage}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !pagination.hasNextPage}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </footer>
  );
};

const CandidateApplicationsList = ({
  status,
  applicationsData,
  errorMessage,
  selectedStatus,
  successfulQuery,
  statusOptions,
  onStatusChange,
  onRetry,
  onPreviousPage,
  onNextPage,
}) => {
  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination ?? null;

  const hasLoadedData = applicationsData !== null;

  const isInitialLoading = status === "loading" && !hasLoadedData;

  const isUpdating = status === "loading" && hasLoadedData;

  const hasRefreshError = status === "error" && hasLoadedData;

  const currentTotal = pagination?.total ?? applications.length;

  const displayedStatus = successfulQuery?.status ?? "";

  const displayedOption = statusOptions.find(
    (option) => option.value === displayedStatus,
  );

  const applicationCountLabel = getApplicationCountLabel(currentTotal);

  const historyDescription = hasLoadedData
    ? displayedStatus
      ? `${applicationCountLabel} with ${
          displayedOption?.label.toLowerCase() || displayedStatus
        } status.`
      : `${applicationCountLabel} across all statuses.`
    : "Review submitted jobs and track each hiring stage.";

  const resolvedErrorMessage = hasLoadedData
    ? [errorMessage, "Previously loaded results are still shown."]
        .filter(Boolean)
        .join(" ")
    : errorMessage;

  return (
    <Card>
      <CardBody className="p-0">
        <header className="flex flex-col gap-5 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-7 text-slate-950">
              Application history
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {historyDescription}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-64">
            <SelectInput
              id="application-status-filter"
              label="Filter by status"
              value={selectedStatus}
              options={statusOptions}
              onChange={(event) => onStatusChange(event.target.value)}
            />

            {isUpdating && (
              <p
                role="status"
                className="inline-flex items-center gap-2 text-xs leading-5 text-slate-500"
              >
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Updating applications
              </p>
            )}
          </div>
        </header>

        {isInitialLoading && <ApplicationsListSkeleton />}

        {status === "error" && (
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <SectionError
              compact={hasLoadedData}
              title={
                hasLoadedData
                  ? "Could not update applications"
                  : "Could not load applications"
              }
              message={resolvedErrorMessage}
              onRetry={onRetry}
            />
          </div>
        )}

        {hasLoadedData && applications.length === 0 && !isInitialLoading && (
          <div className="p-5">
            <EmptyState
              size="compact"
              icon={BriefcaseBusiness}
              title="No applications found"
              description={
                displayedStatus
                  ? "No applications currently match this status."
                  : "Browse open jobs and submit your first application."
              }
              action={
                <Button as={Link} to="/jobs">
                  Browse jobs
                </Button>
              }
            />
          </div>
        )}

        {hasLoadedData && applications.length > 0 && (
          <>
            <div
              className={[
                "divide-y",
                "divide-slate-100",
                "transition-opacity",
                isUpdating ? "opacity-60" : "",
              ].join(" ")}
            >
              {applications.map((application) => (
                <CandidateApplicationRow
                  key={getApplicationId(application)}
                  application={application}
                />
              ))}
            </div>

            <ApplicationsPagination
              pagination={pagination}
              disabled={isUpdating || hasRefreshError}
              onPreviousPage={onPreviousPage}
              onNextPage={onNextPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default CandidateApplicationsList;
