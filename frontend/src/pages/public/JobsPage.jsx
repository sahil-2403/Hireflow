import { useEffect, useMemo, useState } from "react";

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

const SORT_OPTIONS = [
  {
    label: "Newest first",
    sortBy: "createdAt",
    order: "desc",
  },
  {
    label: "Oldest first",
    sortBy: "createdAt",
    order: "asc",
  },
  {
    label: "Job title A-Z",
    sortBy: "title",
    order: "asc",
  },
  {
    label: "Job title Z-A",
    sortBy: "title",
    order: "desc",
  },
  {
    label: "Salary high to low",
    sortBy: "salaryMax",
    order: "desc",
  },
  {
    label: "Salary low to high",
    sortBy: "salaryMin",
    order: "asc",
  },
];

const DEFAULT_FILTERS = {
  search: "",
  location: "",
  employmentType: "",
  workplaceType: "",
  experienceLevel: "",
  sortBy: "createdAt",
  order: "desc",
};

const formatSalary = (job) => {
  if (!job.isSalaryVisible) {
    return "Salary not disclosed";
  }

  if (job.salaryMin == null && job.salaryMax == null) {
    return "Salary not disclosed";
  }

  const currency = job.salaryCurrency || "INR";

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
  }

  if (job.salaryMin != null) {
    return `${currency} ${job.salaryMin}+`;
  }

  return `Up to ${currency} ${job.salaryMax}`;
};

const getJobId = (job) => {
  return job._id || job.id;
};

const getCompanyInitial = (job) => {
  return (job.companyId?.name || job.title || "H").slice(0, 1).toUpperCase();
};

const getPostedLabel = (dateValue) => {
  if (!dateValue) {
    return "Recently posted";
  }

  const createdAt = new Date(dateValue);
  const now = new Date();

  const diffInMs = now.getTime() - createdAt.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) {
    return "Posted today";
  }

  if (diffInDays === 1) {
    return "Posted yesterday";
  }

  if (diffInDays < 7) {
    return `Posted ${diffInDays} days ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(createdAt);
};

const getOptionLabel = (options, value) => {
  return options.find((option) => option.value === value)?.label || value;
};

const getSortLabel = (filters) => {
  const sortOption = SORT_OPTIONS.find((option) => {
    return option.sortBy === filters.sortBy && option.order === filters.order;
  });

  return sortOption?.label || "Newest first";
};

const getActiveFilterChips = (filters) => {
  const chips = [];

  if (filters.search) {
    chips.push({
      key: "search",
      label: `Search: ${filters.search}`,
    });
  }

  if (filters.location) {
    chips.push({
      key: "location",
      label: `Location: ${filters.location}`,
    });
  }

  if (filters.employmentType) {
    chips.push({
      key: "employmentType",
      label: getOptionLabel(EMPLOYMENT_TYPES, filters.employmentType),
    });
  }

  if (filters.workplaceType) {
    chips.push({
      key: "workplaceType",
      label: getOptionLabel(WORKPLACE_TYPES, filters.workplaceType),
    });
  }

  if (filters.experienceLevel) {
    chips.push({
      key: "experienceLevel",
      label: getOptionLabel(EXPERIENCE_LEVELS, filters.experienceLevel),
    });
  }

  if (filters.sortBy !== "createdAt" || filters.order !== "desc") {
    chips.push({
      key: "sort",
      label: `Sort: ${getSortLabel(filters)}`,
    });
  }

  return chips;
};

const FilterSelect = ({ id, label, name, value, onChange, options }) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const JobCard = ({ job }) => {
  const jobId = getJobId(job);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
            {getCompanyInitial(job)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-950">{job.title}</h2>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                Open
              </span>
            </div>

            <p className="mt-1 text-sm font-bold text-slate-700">
              {job.companyId?.name || "Company unavailable"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                📍 {job.location || "Location unavailable"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                💼 {job.employmentType || "Employment unavailable"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                🏢 {job.workplaceType || "Workplace unavailable"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                ⭐ {job.experienceLevel || "Level unavailable"}
              </span>
            </div>

            <p className="mt-4 text-sm font-black text-slate-900">
              {formatSalary(job)}
            </p>

            {job.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
                  >
                    {skill}
                  </span>
                ))}

                {job.skills.length > 6 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    +{job.skills.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <p className="text-xs font-semibold text-slate-500">
            {getPostedLabel(job.createdAt)}
          </p>

          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
};

const JobsPage = () => {
  const [status, setStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");

  const [locationInput, setLocationInput] = useState("");

  const [draftFilters, setDraftFilters] = useState({
    employmentType: "",
    workplaceType: "",
    experienceLevel: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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
          sortBy: filters.sortBy,
          order: filters.order,
        };

        Object.entries(filters).forEach(([key, value]) => {
          if (!value || key === "sortBy" || key === "order") {
            return;
          }

          params[key] = value;
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

  const handleDraftFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === "sort") {
      const selectedSort = SORT_OPTIONS.find(
        (option) => option.label === value,
      );

      setDraftFilters((currentFilters) => ({
        ...currentFilters,
        sortBy: selectedSort?.sortBy || "createdAt",
        order: selectedSort?.order || "desc",
      }));

      return;
    }

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const applySearchAndFilters = () => {
    setFilters({
      search: searchInput.trim(),
      location: locationInput.trim(),
      employmentType: draftFilters.employmentType,
      workplaceType: draftFilters.workplaceType,
      experienceLevel: draftFilters.experienceLevel,
      sortBy: draftFilters.sortBy,
      order: draftFilters.order,
    });

    setPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    applySearchAndFilters();
  };

  const handleApplyAdvancedFilters = () => {
    applySearchAndFilters();
    setIsFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setLocationInput("");

    setDraftFilters({
      employmentType: "",
      workplaceType: "",
      experienceLevel: "",
      sortBy: "createdAt",
      order: "desc",
    });

    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === "search") {
      setSearchInput("");

      setFilters((currentFilters) => ({
        ...currentFilters,
        search: "",
      }));

      setPage(1);
      return;
    }

    if (filterKey === "location") {
      setLocationInput("");

      setFilters((currentFilters) => ({
        ...currentFilters,
        location: "",
      }));

      setPage(1);
      return;
    }

    if (filterKey === "sort") {
      setDraftFilters((currentFilters) => ({
        ...currentFilters,
        sortBy: "createdAt",
        order: "desc",
      }));

      setFilters((currentFilters) => ({
        ...currentFilters,
        sortBy: "createdAt",
        order: "desc",
      }));

      setPage(1);
      return;
    }

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [filterKey]: "",
    }));

    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterKey]: "",
    }));

    setPage(1);
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination;

  const activeFilterChips = useMemo(() => {
    return getActiveFilterChips(filters);
  }, [filters]);

  const activeAdvancedFilterCount = [
    filters.employmentType,
    filters.workplaceType,
    filters.experienceLevel,
    filters.sortBy !== "createdAt" || filters.order !== "desc" ? "sort" : "",
  ].filter(Boolean).length;

  return (
    <main className="bg-slate-50">
      <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Browse jobs
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Search your preferred job by role, location, or skill.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-1 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleSearchSubmit}>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto_auto] lg:items-end">
              <div>
                <label
                  htmlFor="search"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  What job are you looking for?
                </label>

                <input
                  id="search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Frontend Developer, React, Node.js"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Location
                </label>

                <input
                  id="location"
                  type="search"
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                  placeholder="Pune, Mumbai, Remote"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsFiltersOpen((currentValue) => !currentValue)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Filters
                {activeAdvancedFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {activeAdvancedFilterCount}
                  </span>
                )}
              </button>
            </div>
          </form>

          {isFiltersOpen && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                  id="employmentType"
                  label="Employment"
                  name="employmentType"
                  value={draftFilters.employmentType}
                  onChange={handleDraftFilterChange}
                  options={EMPLOYMENT_TYPES}
                />

                <FilterSelect
                  id="workplaceType"
                  label="Workplace"
                  name="workplaceType"
                  value={draftFilters.workplaceType}
                  onChange={handleDraftFilterChange}
                  options={WORKPLACE_TYPES}
                />

                <FilterSelect
                  id="experienceLevel"
                  label="Experience"
                  name="experienceLevel"
                  value={draftFilters.experienceLevel}
                  onChange={handleDraftFilterChange}
                  options={EXPERIENCE_LEVELS}
                />

                <div>
                  <label
                    htmlFor="sort"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Sort
                  </label>

                  <select
                    id="sort"
                    name="sort"
                    value={getSortLabel(draftFilters)}
                    onChange={handleDraftFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-center items-center gap-3 sm:flex-row sm:items-center ">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear all
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAdvancedFilters}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          )}

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
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Job results
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {pagination?.total ?? jobs.length} matching job
                  {(pagination?.total ?? jobs.length) === 1 ? "" : "s"}
                </h2>
              </div>

              {pagination && (
                <p className="text-sm font-semibold text-slate-500">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </p>
              )}
            </div>

            {status === "loading" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">Loading jobs...</p>
              </div>
            )}

            {status === "error" && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            {status === "success" && jobs.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
                  🔎
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-950">
                  No jobs found
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Try changing your search, location, or filters.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}

            {status === "success" && jobs.length > 0 && (
              <>
                <div className="grid gap-4">
                  {jobs.map((job) => (
                    <JobCard key={getJobId(job)} job={job} />
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
                        onClick={() =>
                          setPage((currentPage) => currentPage - 1)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={!pagination.hasNextPage}
                        onClick={() =>
                          setPage((currentPage) => currentPage + 1)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="grid gap-6 self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Candidate checklist
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Before applying
              </h2>

              <div className="mt-4 grid gap-3 text-sm">
                <Link
                  to="/candidate/profile"
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 font-bold text-slate-800 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Complete profile →
                </Link>

                <Link
                  to="/candidate/resume"
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 font-bold text-slate-800 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Upload resume →
                </Link>

                <Link
                  to="/candidate/applications"
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 font-bold text-slate-800 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Track applications →
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                Search tips
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Find better matches
              </h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-900">
                    Start with role + location
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Example: React Developer in Pune or Remote.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-900">
                    Use filters after search
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    First search broadly, then filter by workplace or
                    experience.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-900">
                    Check salary sort
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Use salary sorting when companies have made salary visible.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default JobsPage;
