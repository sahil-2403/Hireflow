import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";

import getApiError from "../../utils/getApiError";

const EMPLOYMENT_TYPES = [
  {
    label: "All employment types",
    value: "",
  },
  {
    label: "Full time",
    value: "full-time",
  },
  {
    label: "Part time",
    value: "part-time",
  },
  {
    label: "Contract",
    value: "contract",
  },
  {
    label: "Internship",
    value: "internship",
  },
];

const WORKPLACE_TYPES = [
  {
    label: "All workplace types",
    value: "",
  },
  {
    label: "Onsite",
    value: "onsite",
  },
  {
    label: "Remote",
    value: "remote",
  },
  {
    label: "Hybrid",
    value: "hybrid",
  },
];

const EXPERIENCE_LEVELS = [
  {
    label: "All levels",
    value: "",
  },
  {
    label: "Entry",
    value: "entry",
  },
  {
    label: "Mid",
    value: "mid",
  },
  {
    label: "Senior",
    value: "senior",
  },
  {
    label: "Lead",
    value: "lead",
  },
];

const formatSalary = (job) => {
  if (!job.isSalaryVisible) {
    return "Salary not disclosed";
  }

  if (job.salaryMin === null && job.salaryMax === null) {
    return "Salary not disclosed";
  }

  const currency = job.salaryCurrency || "INR";

  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
  }

  if (job.salaryMin !== null) {
    return `${currency} ${job.salaryMin}+`;
  }

  return `Up to ${currency} ${job.salaryMax}`;
};

const JobsPage = () => {
  const [status, setStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    employmentType: "",
    workplaceType: "",
    experienceLevel: "",
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchJobs = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const params = {
          page,
          limit: 10,
          sortBy: "createdAt",
          order: "desc",
        };

        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params[key] = value;
          }
        });

        const result = await listPublicJobs(params);

        if (shouldIgnore) {
          return;
        }

        setJobsData(result.data);
        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setJobsData(null);
        setStatus("error");
      }
    };

    fetchJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [filters, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));

    setPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setFilters((currentFilters) => ({
      ...currentFilters,
      search: searchInput.trim(),
    }));

    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");

    setFilters({
      search: "",
      employmentType: "",
      workplaceType: "",
      experienceLevel: "",
    });

    setPage(1);
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination;

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Open opportunities
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">
            Find your next role
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Browse open jobs from companies hiring through HireFlow.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSearchSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title, skills, description"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="employmentType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employment
              </label>

              <select
                id="employmentType"
                name="employmentType"
                value={filters.employmentType}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {EMPLOYMENT_TYPES.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="workplaceType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Workplace
              </label>

              <select
                id="workplaceType"
                name="workplaceType"
                value={filters.workplaceType}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {WORKPLACE_TYPES.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="experienceLevel"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Experience
              </label>

              <select
                id="experienceLevel"
                name="experienceLevel"
                value={filters.experienceLevel}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {EXPERIENCE_LEVELS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
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
          </div>
        </form>

        {status === "loading" && (
          <p className="text-sm text-slate-600">Loading jobs...</p>
        )}

        {status === "error" && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && jobs.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">No jobs found</h2>

            <p className="mt-2 text-sm text-slate-600">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {status === "success" && jobs.length > 0 && (
          <>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {job.companyId?.name || "Company unavailable"}
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-slate-950">
                        {job.title}
                      </h2>

                      <p className="mt-2 text-sm text-slate-600">
                        {job.location} ·{" "}
                        <span className="capitalize">{job.workplaceType}</span>{" "}
                        ·{" "}
                        <span className="capitalize">{job.employmentType}</span>{" "}
                        ·{" "}
                        <span className="capitalize">
                          {job.experienceLevel}
                        </span>
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {formatSalary(job)}
                      </p>
                    </div>

                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      View details
                    </Link>
                  </div>

                  {job.skills?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.skills.slice(0, 8).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {pagination && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default JobsPage;
