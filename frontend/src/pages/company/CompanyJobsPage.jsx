import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { listManagedJobs, updateManagedJobStatus } from "../../api/job.api";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";
import { formatDate } from "../../utils/formatDate";
import { getOptionLabel } from "../../utils/options";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import Alert from "../../components/ui/Alert";
import FilterChips from "../../components/ui/FilterChips";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";

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
      label: getOptionLabel(JOB_STATUS_OPTIONS, selectedStatus, selectedStatus),
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
              <TextInput
                id="search"
                type="search"
                label="Search jobs"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title, description, or skills"
              />

              <SelectInput
                id="status"
                label="Status"
                value={selectedStatus}
                onChange={handleStatusFilterChange}
                options={JOB_STATUS_OPTIONS}
              />

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

            <FilterChips
              chips={activeFilterChips}
              onRemove={handleRemoveFilter}
              onClear={handleClearFilters}
              className="mt-5"
            />
          </CardBody>
        </Card>
      )}

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {errorMessage && requestStatus !== "error" && (
        <Alert variant="error">{errorMessage}</Alert>
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
        <Alert variant="error" title="Could not load jobs">
          {errorMessage}
        </Alert>
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

                    <span className="lg:hidden">
                      <JobStatusBadge status={job.status} />
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
                    to={`/company/applications/${job._id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View applications
                  </Button>

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
