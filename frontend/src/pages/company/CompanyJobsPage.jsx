import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { listManagedJobs, updateManagedJobStatus } from "../../api/job.api";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

import JobStatusBadge from "../../components/company/JobStatusBadge";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";

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

const getStatusLabel = (status) => {
  return JOB_STATUS_OPTIONS.find((option) => option.value === status)?.label;
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
      label: getStatusLabel(selectedStatus) || selectedStatus,
    });
  }

  return chips;
};

const CompanyJobsPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

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

        setJobsData(null);
        setRequestStatus(
          isCompanyProfileMissingError(normalizedError)
            ? "company-missing"
            : "error",
        );
      }
    };

    fetchJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, search, refreshKey]);

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
    const nextStatus = job.status === "open" ? "closed" : "open";

    try {
      setUpdatingJobId(job._id);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await updateManagedJobStatus(job._id, nextStatus);

      setSuccessMessage(result.message);

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination;

  const activeFilterChips = useMemo(() => {
    return getActiveFilterChips({
      search,
      selectedStatus,
    });
  }, [search, selectedStatus]);

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company jobs"
        title="Manage jobs"
        description="View your company jobs, search postings, filter by status, and open or close job listings."
        actions={
          requestStatus === "company-missing" ? (
            <Button as={Link} to="/company/profile">
              Create company profile
            </Button>
          ) : (
            <Button as={Link} to="/company/jobs/new">
              Create job
            </Button>
          )
        }
      />

      {requestStatus !== "company-missing" && (
        <Card>
          <CardBody>
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-4 lg:grid-cols-[1.4fr_260px_auto]"
            >
              <FormField label="Search jobs" htmlFor="search">
                <input
                  id="search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by title, description, or skills"
                  className={getInputClassName()}
                />
              </FormField>

              <FormField label="Status" htmlFor="status">
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={handleStatusFilterChange}
                  className={getInputClassName()}
                >
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-end gap-3">
                <Button type="submit" className="shrink-0">
                  Search
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="shrink-0"
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

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {successMessage && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && requestStatus !== "error" && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {requestStatus === "loading" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">Loading company jobs...</p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "company-missing" && (
        <CompanySetupRequired description="Create your company profile before posting and managing jobs." />
      )}

      {requestStatus === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="font-bold text-red-700">Could not load jobs</p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "success" && jobs.length === 0 && (
        <EmptyState
          icon="💼"
          title="No jobs found"
          description="Create your first job or try changing your filters."
          action={
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button as={Link} to="/company/jobs/new">
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
      )}

      {requestStatus === "success" && jobs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 lg:grid">
            <p>Job</p>
            <p>Type</p>
            <p>Status</p>
            <p>Created</p>
            <p className="text-right">Actions</p>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <article
                key={job._id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center lg:px-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">{job.title}</p>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600 lg:hidden">
                      {job.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    📍 {job.location || "Location unavailable"}
                  </p>

                  {job.createdBy && (
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Created by {job.createdBy.username || job.createdBy.email}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold capitalize text-slate-800">
                    {job.employmentType}
                  </p>

                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {job.workplaceType} · {job.experienceLevel}
                  </p>
                </div>

                <div className="hidden lg:block">
                  <JobStatusBadge status={job.status} />
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  {formatDate(job.createdAt)}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <Button
                    as={Link}
                    to={`/company/jobs/${job._id}/edit`}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    disabled={updatingJobId === job._id}
                    onClick={() => handleToggleJobStatus(job)}
                    variant={job.status === "open" ? "danger" : "secondary"}
                    size="sm"
                    className={
                      job.status === "closed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : ""
                    }
                  >
                    {updatingJobId === job._id
                      ? "Updating..."
                      : job.status === "open"
                        ? "Close"
                        : "Open"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Card>
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

export default CompanyJobsPage;
