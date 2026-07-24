import { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  LoaderCircle,
  RotateCcw,
  Search,
  UsersRound,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import { listManagedApplicationJobs } from "../../api/application.api";

import CompanyApplicationJobRow from "../../components/company/CompanyApplicationJobRow";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyApplicationJobsSkeleton from "../../components/loading/CompanyApplicationJobsSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";

import getApiError from "../../utils/getApiError";

import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import { getSortOptionByValue } from "../../utils/options";

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

const SORT_OPTIONS = [
  {
    label: "Recent application activity",

    value: "lastApplicationAt:desc",

    sortBy: "lastApplicationAt",

    order: "desc",
  },
  {
    label: "Latest jobs",

    value: "createdAt:desc",

    sortBy: "createdAt",
    order: "desc",
  },
  {
    label: "Oldest jobs",

    value: "createdAt:asc",

    sortBy: "createdAt",
    order: "asc",
  },
  {
    label: "Applications high to low",

    value: "applicationCount:desc",

    sortBy: "applicationCount",

    order: "desc",
  },
  {
    label: "Applications low to high",

    value: "applicationCount:asc",

    sortBy: "applicationCount",

    order: "asc",
  },
  {
    label: "Job title A-Z",

    value: "title:asc",

    sortBy: "title",
    order: "asc",
  },
];

const getStatusLabel = (value) => {
  return (
    JOB_STATUS_OPTIONS.find((option) => option.value === value)?.label || value
  );
};

const getSortLabel = (value) => {
  return getSortOptionByValue(SORT_OPTIONS, value, SORT_OPTIONS[0]).label;
};

const getActiveFilterChips = ({ search, selectedStatus, sortValue }) => {
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

  if (sortValue !== SORT_OPTIONS[0].value) {
    chips.push({
      key: "sort",

      label: `Sort: ${getSortLabel(sortValue)}`,
    });
  }

  return chips;
};

const ActiveApplicationFilters = ({ chips, onRemove, onClear }) => {
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

const ApplicationGroupsPagination = ({
  pagination,
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

const CompanyApplicationsPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplicationJobs = async () => {
      try {
        setRequestStatus("loading");

        setErrorMessage("");

        const sortOption = getSortOptionByValue(
          SORT_OPTIONS,
          sortValue,
          SORT_OPTIONS[0],
        );

        const params = {
          page,
          limit: 10,

          sortBy: sortOption.sortBy,

          order: sortOption.order,
        };

        if (selectedStatus) {
          params.status = selectedStatus;
        }

        if (search) {
          params.search = search;
        }

        const result = await listManagedApplicationJobs(params);

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
         * Preserve existing groups
         * when a search, filter,
         * sort or pagination refresh
         * fails.
         */
        setRequestStatus("error");
      }
    };

    fetchApplicationJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, sortValue, search, loadAttempt]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setSearch(searchInput.trim());

    setPage(1);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);

    setPage(1);
  };

  const handleSortChange = (event) => {
    setSortValue(event.target.value);

    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStatus("");

    setSortValue(SORT_OPTIONS[0].value);

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

      return;
    }

    if (filterKey === "sort") {
      setSortValue(SORT_OPTIONS[0].value);

      setPage(1);
    }
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination ?? null;

  const hasLoadedData = jobsData !== null;

  const isInitialLoading = requestStatus === "loading" && !hasLoadedData;

  const isUpdating = requestStatus === "loading" && hasLoadedData;

  const currentTotal = pagination?.total ?? jobs.length;

  const activeFilterChips = useMemo(
    () =>
      getActiveFilterChips({
        search,
        selectedStatus,
        sortValue,
      }),
    [search, selectedStatus, sortValue],
  );

  return (
    <div className="grid gap-6">
      <PageHero
        title="Applications by job"
        description="Review applicant activity grouped by job, compare match information, and open the focused hiring pipeline for each role."
        actions={
          <Button as={Link} to="/company/jobs" variant="secondary">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            Manage jobs
          </Button>
        }
      />

      {requestStatus === "company-missing" ? (
        <CompanySetupRequired description="Create your company profile before reviewing applications." />
      ) : (
        <>
          <Card>
            <CardBody className="p-4 sm:p-5">
              <form
                onSubmit={handleSearchSubmit}
                className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_250px_auto] lg:items-end"
              >
                <TextInput
                  id="application-jobs-search"
                  type="search"
                  label="Search jobs"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by title, location, or skill"
                />

                <SelectInput
                  id="application-jobs-status"
                  label="Job status"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  options={JOB_STATUS_OPTIONS}
                />

                <SelectInput
                  id="application-jobs-sort"
                  label="Sort"
                  value={sortValue}
                  onChange={handleSortChange}
                  options={SORT_OPTIONS}
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

              <ActiveApplicationFilters
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
                      : "Application groups"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedStatus
                      ? `Showing ${getStatusLabel(
                          selectedStatus,
                        ).toLowerCase()}.`
                      : "Showing open and closed job pipelines."}
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
                    Updating groups
                  </p>
                )}
              </header>

              {isInitialLoading && <CompanyApplicationJobsSkeleton />}

              {requestStatus === "error" && (
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <SectionError
                    compact={hasLoadedData}
                    title="Could not load application groups"
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
                    icon={UsersRound}
                    title="No application groups found"
                    description={
                      activeFilterChips.length > 0
                        ? "No jobs match the current search, status, or sort filters."
                        : "Application activity will appear here after candidates apply to a company job."
                    }
                    action={
                      activeFilterChips.length > 0 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleClearFilters}
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button as={Link} to="/company/jobs">
                          Manage jobs
                        </Button>
                      )
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
                    {jobs.map((job) => (
                      <CompanyApplicationJobRow
                        key={job._id || job.id}
                        job={job}
                      />
                    ))}
                  </div>

                  <ApplicationGroupsPagination
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

export default CompanyApplicationsPage;
