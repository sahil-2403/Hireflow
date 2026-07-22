import { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import { listManagedJobs, updateManagedJobStatus } from "../../api/job.api";

import CompanyManagedJobRow from "../../components/company/CompanyManagedJobRow";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyJobsListSkeleton from "../../components/loading/CompanyJobsListSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";

import getApiError from "../../utils/getApiError";

import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import notify from "../../utils/notify";

const JOB_STATUS_OPTIONS = [
  {
    label: "All jobs",
    value: "",
  },
  {
    label: "Open jobs",
    value: "open",
  },
  {
    label: "Closed jobs",
    value: "closed",
  },
];

const getStatusLabel = (selectedStatus) => {
  return (
    JOB_STATUS_OPTIONS.find((option) => option.value === selectedStatus)
      ?.label || selectedStatus
  );
};

const getActiveFilterChips = ({ search, selectedStatus }) => {
  const chips = [];

  if (search) {
    chips.push({
      key: "search",
      label: `Search: ${search}`,
    });
  }

  if (selectedStatus) {
    chips.push({
      key: "status",
      label: getStatusLabel(selectedStatus),
    });
  }

  return chips;
};

const ActiveJobFilters = ({ chips, onRemove, onClear }) => {
  if (!chips.length) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
      <span className="mr-1 text-xs font-medium leading-5 text-slate-500">
        Active filters:
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className={[
            "inline-flex min-h-9",
            "max-w-full items-center",
            "gap-1.5 rounded-full",
            "border border-blue-100",
            "bg-blue-50",
            "px-3 py-1.5",
            "text-xs font-medium",
            "text-blue-700",
            "transition-colors",

            "hover:bg-blue-100",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-blue-500",
          ].join(" ")}
        >
          <span className="min-w-0 wrap-break-word">{chip.label}</span>

          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className={[
          "inline-flex min-h-9",
          "items-center gap-1.5",
          "rounded-full",
          "px-3 py-1.5",
          "text-xs font-medium",
          "text-slate-600",
          "transition-colors",

          "hover:bg-slate-100",
          "hover:text-slate-900",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-blue-500",
        ].join(" ")}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Clear all
      </button>
    </div>
  );
};

const JobsPagination = ({ pagination, onPreviousPage, onNextPage }) => {
  if (!pagination) {
    return null;
  }

  return (
    <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm leading-6 text-slate-600">
        Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
        {pagination.total} jobs
      </p>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="secondary"
          disabled={!pagination.hasPreviousPage}
          onClick={onPreviousPage}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={!pagination.hasNextPage}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </footer>
  );
};

const CompanyJobsPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [loadAttempt, setLoadAttempt] = useState(0);

  const [updatingJobId, setUpdatingJobId] = useState(null);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchJobs = async () => {
      try {
        setRequestStatus("loading");

        setErrorMessage("");

        const params = {
          page,
          limit: 10,
        };

        if (selectedStatus) {
          params.status = selectedStatus;
        }

        if (search) {
          params.search = search;
        }

        const result = await listManagedJobs(params);

        if (shouldIgnore) {
          return;
        }

        setJobsData(result.data);

        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        if (isCompanyProfileMissingError(normalizedError)) {
          setJobsData(null);

          setRequestStatus("company-missing");

          return;
        }

        /*
         * Keep previously loaded jobs
         * visible if a search, filter,
         * pagination or status refresh
         * fails.
         */
        setRequestStatus("error");
      }
    };

    fetchJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, search, refreshKey, loadAttempt]);

  const handleStatusFilterChange = (event) => {
    setSelectedStatus(event.target.value);

    setPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setSearch(searchInput.trim());

    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStatus("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === "search") {
      setSearchInput("");
      setSearch("");
      setPage(1);

      return;
    }

    if (filterKey === "status") {
      setSelectedStatus("");
      setPage(1);
    }
  };

  const handleToggleJobStatus = async (job) => {
    const jobId = job._id || job.id;

    const nextStatus = job.status === "open" ? "closed" : "open";

    try {
      setUpdatingJobId(jobId);

      const result = await updateManagedJobStatus(jobId, nextStatus);

      notify.success(
        result.message ||
          `Job ${nextStatus === "open" ? "opened" : "closed"} successfully.`,
      );

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not update job status", {
        description: normalizedError.message,
      });
    } finally {
      setUpdatingJobId(null);
    }
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination ?? null;

  const hasLoadedData = jobsData !== null;

  const isInitialLoading = requestStatus === "loading" && !hasLoadedData;

  const isUpdating = requestStatus === "loading" && hasLoadedData;

  const activeFilterChips = useMemo(
    () =>
      getActiveFilterChips({
        search,
        selectedStatus,
      }),
    [search, selectedStatus],
  );

  const currentTotal = pagination?.total ?? jobs.length;

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company jobs"
        title="Manage jobs"
        description="Search your company listings, review their status, manage applications, and open or close job postings."
        actions={
          requestStatus === "company-missing" ? (
            <Button as={Link} to="/company/profile">
              Create company profile
            </Button>
          ) : (
            <Button as={Link} to="/company/jobs/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create job
            </Button>
          )
        }
      />

      {requestStatus === "company-missing" ? (
        <CompanySetupRequired description="Create your company profile before posting and managing jobs." />
      ) : (
        <>
          <Card>
            <CardBody className="p-4 sm:p-5">
              <form
                onSubmit={handleSearchSubmit}
                className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end"
              >
                <TextInput
                  id="managed-jobs-search"
                  type="search"
                  label="Search jobs"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by title, description, or skill"
                />

                <SelectInput
                  id="managed-jobs-status"
                  label="Status"
                  value={selectedStatus}
                  onChange={handleStatusFilterChange}
                  options={JOB_STATUS_OPTIONS}
                />

                <div className="grid grid-cols-2 gap-2 lg:flex">
                  <Button type="submit" className="w-full lg:w-auto">
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Search
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full lg:w-auto"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </div>
              </form>

              <ActiveJobFilters
                chips={activeFilterChips}
                onRemove={handleRemoveFilter}
                onClear={handleClearFilters}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-0">
              <header className="flex flex-col gap-3 border-b border-slate-100 p-2 sm:flex-row sm:items-end sm:justify-between sm:p-2">
                <div>
                  <h2 className="text-xl font-semibold leading-7 text-slate-950">
                    {hasLoadedData
                      ? `${currentTotal} ${currentTotal === 1 ? "job" : "jobs"}`
                      : "Company jobs"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedStatus
                      ? `Showing ${getStatusLabel(
                          selectedStatus,
                        ).toLowerCase()}.`
                      : "Showing open and closed jobs."}
                  </p>
                </div>

                {isUpdating && (
                  <p
                    role="status"
                    className="inline-flex items-center gap-2 text-sm leading-6 text-slate-500"
                  >
                    <LoaderCircle
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    Updating jobs
                  </p>
                )}
              </header>

              {isInitialLoading && <CompanyJobsListSkeleton />}

              {requestStatus === "error" && (
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <SectionError
                    compact={hasLoadedData}
                    title="Could not load jobs"
                    message={errorMessage}
                    onRetry={() =>
                      setLoadAttempt((currentAttempt) => currentAttempt + 1)
                    }
                  />
                </div>
              )}

              {hasLoadedData && jobs.length === 0 && !isInitialLoading && (
                <div className="p-5">
                  <EmptyState
                    size="compact"
                    icon={BriefcaseBusiness}
                    title="No jobs found"
                    description={
                      activeFilterChips.length > 0
                        ? "No managed jobs match the current search or status filter."
                        : "Create your first job to start receiving applications."
                    }
                    action={
                      <div className="flex flex-col justify-center gap-2 min-[420px]:flex-row">
                        <Button as={Link} to="/company/jobs/new">
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Create job
                        </Button>

                        {activeFilterChips.length > 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClearFilters}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    }
                  />
                </div>
              )}

              {hasLoadedData && jobs.length > 0 && (
                <>
                  <div
                    className={[
                      "divide-y divide-slate-100",
                      "transition-opacity",

                      isUpdating ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    {jobs.map((job) => {
                      const jobId = job._id || job.id;

                      return (
                        <CompanyManagedJobRow
                          key={jobId}
                          job={job}
                          isUpdating={updatingJobId === jobId}
                          onToggleStatus={handleToggleJobStatus}
                        />
                      );
                    })}
                  </div>

                  <JobsPagination
                    pagination={pagination}
                    onPreviousPage={() =>
                      setPage((currentPage) => Math.max(currentPage - 1, 1))
                    }
                    onNextPage={() => setPage((currentPage) => currentPage + 1)}
                  />
                </>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

export default CompanyJobsPage;
