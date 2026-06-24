import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { listManagedJobs, updateManagedJobStatus } from "../../api/job.api";

import getApiError from "../../utils/getApiError";

import JobStatusBadge from "../../components/company/JobStatusBadge";

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

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
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
        setRequestStatus("error");
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

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Company jobs
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Manage jobs
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            View your company jobs, filter them, and open or close job postings.
          </p>
        </div>

        <Link
          to="/company/jobs/new"
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create job
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto]"
        >
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search jobs
            </label>

            <input
              id="search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, description, or skills"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Status
            </label>

            <select
              id="status"
              value={selectedStatus}
              onChange={handleStatusFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {JOB_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {successMessage && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && requestStatus !== "error" && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {requestStatus === "loading" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading company jobs...</p>
        </section>
      )}

      {requestStatus === "error" && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="font-semibold text-red-700">Could not load jobs</p>

          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      )}

      {requestStatus === "success" && jobs.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">No jobs found</h2>

          <p className="mt-2 text-sm text-slate-600">
            Create your first job or try changing your filters.
          </p>
        </section>
      )}

      {requestStatus === "success" && jobs.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600 lg:grid">
            <p>Job</p>
            <p>Type</p>
            <p>Status</p>
            <p>Created</p>
            <p>Action</p>
          </div>

          <div className="divide-y divide-slate-200">
            {jobs.map((job) => (
              <article
                key={job._id}
                className="grid gap-4 px-6 py-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-950">{job.title}</p>

                  <p className="mt-1 text-sm text-slate-500">{job.location}</p>

                  {job.createdBy && (
                    <p className="mt-1 text-xs text-slate-400">
                      Created by {job.createdBy.username || job.createdBy.email}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm capitalize text-slate-700">
                    {job.employmentType}
                  </p>

                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {job.workplaceType} · {job.experienceLevel}
                  </p>
                </div>

                <div>
                  <JobStatusBadge status={job.status} />
                </div>

                <p className="text-sm text-slate-600">
                  {formatDate(job.createdAt)}
                </p>

                <button
                  type="button"
                  disabled={updatingJobId === job._id}
                  onClick={() => handleToggleJobStatus(job)}
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                    job.status === "open"
                      ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  ].join(" ")}
                >
                  {updatingJobId === job._id
                    ? "Updating..."
                    : job.status === "open"
                      ? "Close"
                      : "Open"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {requestStatus === "success" && pagination && (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
            {pagination.total} jobs
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((currentPage) => currentPage - 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default CompanyJobsPage;
