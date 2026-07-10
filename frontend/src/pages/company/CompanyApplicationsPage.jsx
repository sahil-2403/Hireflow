import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { listManagedApplicationJobs } from "../../api/application.api";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import MatchScoreBadge from "../../components/application/MatchScoreBadge";
import JobStatusBadge from "../../components/company/JobStatusBadge";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

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

const getInputClassName = () => {
  return [
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  ].join(" ");
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const getSortOption = (value) => {
  return (
    SORT_OPTIONS.find((option) => option.value === value) || SORT_OPTIONS[0]
  );
};

const getStatusLabel = (value) => {
  return (
    JOB_STATUS_OPTIONS.find((option) => option.value === value)?.label || value
  );
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
      label: `Sort: ${getSortOption(sortValue).label}`,
    });
  }

  return chips;
};

const JobMetric = ({ label, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2  font-medium text-slate-950">{value}</p>
    </div>
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

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplicationJobs = async () => {
      try {
        setRequestStatus("loading");
        setErrorMessage("");

        const sortOption = getSortOption(sortValue);

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

        setJobsData(null);
        setRequestStatus(
          isCompanyProfileMissingError(normalizedError)
            ? "company-missing"
            : "error",
        );
      }
    };

    fetchApplicationJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, sortValue, search]);

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

  const pagination = jobsData?.pagination;

  const activeFilterChips = useMemo(() => {
    return getActiveFilterChips({
      search,
      selectedStatus,
      sortValue,
    });
  }, [search, selectedStatus, sortValue]);

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company applications"
        title="Applications by job"
        description="Review application activity grouped by job, then open a focused applicant list for each role."
      />

      {requestStatus !== "company-missing" && (
        <Card>
          <CardBody>
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-4 lg:grid-cols-[1.3fr_220px_260px_auto]"
            >
              <FormField label="Search jobs" htmlFor="search">
                <input
                  id="search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search jobs by title, location, or skill"
                  className={getInputClassName()}
                />
              </FormField>

              <FormField label="Status" htmlFor="status">
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className={getInputClassName()}
                >
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Sort" htmlFor="sort">
                <select
                  id="sort"
                  value={sortValue}
                  onChange={handleSortChange}
                  className={getInputClassName()}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-end gap-3">
                <Button type="submit">Search</Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              </div>
            </form>

            {activeFilterChips.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active filters:
                </span>

                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleRemoveFilter(chip.key)}
                    className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                  >
                    {chip.label} ×
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {requestStatus === "loading" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">
              Loading application groups...
            </p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "company-missing" && (
        <CompanySetupRequired description="Create your company profile before reviewing applications." />
      )}

      {requestStatus === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="font-bold text-red-700">
              Could not load application groups
            </p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "success" && jobs.length === 0 && (
        <EmptyState
          icon="📥"
          title="No application groups found"
          description="Try changing your filters or wait for candidates to apply."
          action={
            activeFilterChips.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            ) : null
          }
        />
      )}

      {requestStatus === "success" && jobs.length > 0 && (
        <section className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardBody className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-slate-950">
                        {job.title}
                      </h2>

                      <JobStatusBadge status={job.status} />
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {job.location || "Location unavailable"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold capitalize text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {job.employmentType || "Employment unavailable"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {job.workplaceType || "Workplace unavailable"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {job.experienceLevel || "Level unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-evenly">
                    <JobMetric
                      label="Applications"
                      value={job.applicationCount || 0}
                    />

                    <JobMetric
                      label="Last applied"
                      value={formatDate(job.lastApplicationAt)}
                    />

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Best match
                      </p>

                      <MatchScoreBadge match={job.bestMatch} size="sm" />
                    </div>
                  </div>

                  <div className="flex lg:justify-end">
                    <Button
                      as={Link}
                      to={`/company/applications/${job._id}`}
                      variant="secondary"
                    >
                      View applications
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      {requestStatus === "success" && pagination && (
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
              {pagination.total} jobs
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default CompanyApplicationsPage;
