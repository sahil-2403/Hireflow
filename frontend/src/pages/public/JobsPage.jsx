import { useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";

import getApiError from "../../utils/getApiError";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

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
    value: "createdAt:desc",
  },
  {
    label: "Oldest first",
    sortBy: "createdAt",
    order: "asc",
    value: "createdAt:asc",
  },
  {
    label: "Job title A-Z",
    sortBy: "title",
    order: "asc",
    value: "title:asc",
  },
  {
    label: "Job title Z-A",
    sortBy: "title",
    order: "desc",
    value: "title:desc",
  },
  {
    label: "Salary high to low",
    sortBy: "salaryMax",
    order: "desc",
    value: "salaryMax:desc",
  },
  {
    label: "Salary low to high",
    sortBy: "salaryMin",
    order: "asc",
    value: "salaryMin:asc",
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

const getInputClassName = () => {
  return [
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  ].join(" ");
};

const getSelectClassName = () => {
  return [
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition",
    "focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  ].join(" ");
};

const getValidOptionValue = (options, value) => {
  const isValid = options.some((option) => option.value === value);

  return isValid ? value : "";
};

const getSortOptionValue = (filters) => {
  const sortOption = SORT_OPTIONS.find((option) => {
    return option.sortBy === filters.sortBy && option.order === filters.order;
  });

  return sortOption?.value || "createdAt:desc";
};

const getFiltersFromSearchParams = (searchParams) => {
  const sortBy = searchParams.get("sortBy") || DEFAULT_FILTERS.sortBy;
  const order = searchParams.get("order") || DEFAULT_FILTERS.order;

  const isValidSort = SORT_OPTIONS.some((option) => {
    return option.sortBy === sortBy && option.order === order;
  });

  return {
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    employmentType: getValidOptionValue(
      EMPLOYMENT_TYPES,
      searchParams.get("employmentType") || "",
    ),
    workplaceType: getValidOptionValue(
      WORKPLACE_TYPES,
      searchParams.get("workplaceType") || "",
    ),
    experienceLevel: getValidOptionValue(
      EXPERIENCE_LEVELS,
      searchParams.get("experienceLevel") || "",
    ),
    sortBy: isValidSort ? sortBy : DEFAULT_FILTERS.sortBy,
    order: isValidSort ? order : DEFAULT_FILTERS.order,
  };
};

const getPageFromSearchParams = (searchParams) => {
  const page = Number(searchParams.get("page") || 1);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
};

const createSearchParamsFromFilters = (filters, page = 1) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    if (key === "sortBy" && value === DEFAULT_FILTERS.sortBy) {
      return;
    }

    if (key === "order" && value === DEFAULT_FILTERS.order) {
      return;
    }

    params.set(key, value);
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
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
    <FormField label={label} htmlFor={id}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={getSelectClassName()}
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

const JobMetaPill = ({ children }) => {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
      {children}
    </span>
  );
};

const SkillPill = ({ children, variant = "blue" }) => {
  const className =
    variant === "blue"
      ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
      : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600";

  return <span className={className}>{children}</span>;
};

const JobCard = ({ job }) => {
  const jobId = getJobId(job);

  return (
    <Card
      as="article"
      className="p-0 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <CardBody>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
              {getCompanyInitial(job)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">
                  {job.title}
                </h2>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Open
                </span>
              </div>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {job.companyId?.name || "Company unavailable"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <JobMetaPill>
                  📍 {job.location || "Location unavailable"}
                </JobMetaPill>
                <JobMetaPill>
                  💼 {job.employmentType || "Employment unavailable"}
                </JobMetaPill>
                <JobMetaPill>
                  🏢 {job.workplaceType || "Workplace unavailable"}
                </JobMetaPill>
                <JobMetaPill>
                  ⭐ {job.experienceLevel || "Level unavailable"}
                </JobMetaPill>
              </div>

              <p className="mt-4 text-sm font-black text-slate-900">
                {formatSalary(job)}
              </p>

              {job.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.slice(0, 6).map((skill) => (
                    <SkillPill key={skill}>{skill}</SkillPill>
                  ))}

                  {job.skills.length > 6 && (
                    <SkillPill variant="slate">
                      +{job.skills.length - 6}
                    </SkillPill>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <p className="text-xs font-semibold text-slate-500">
              {getPostedLabel(job.createdAt)}
            </p>

            <Button as={Link} to={`/jobs/${jobId}`}>
              View details
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateChecklistCard = () => {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Candidate checklist
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Before applying
        </h2>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3 text-sm">
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
      </CardBody>
    </Card>
  );
};

const SearchTipsCard = () => {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Search tips
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Find better matches
        </h2>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3">
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
              First search broadly, then filter by workplace or experience.
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
      </CardBody>
    </Card>
  );
};

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParamsString = searchParams.toString();

  const filters = useMemo(() => {
    return getFiltersFromSearchParams(new URLSearchParams(searchParamsString));
  }, [searchParamsString]);

  const page = useMemo(() => {
    return getPageFromSearchParams(new URLSearchParams(searchParamsString));
  }, [searchParamsString]);

  const [status, setStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(filters.search);

  const [locationInput, setLocationInput] = useState(filters.location);

  const [draftFilters, setDraftFilters] = useState({
    employmentType: filters.employmentType,
    workplaceType: filters.workplaceType,
    experienceLevel: filters.experienceLevel,
    sortBy: filters.sortBy,
    order: filters.order,
  });

  useEffect(() => {
    setSearchInput(filters.search);
    setLocationInput(filters.location);

    setDraftFilters({
      employmentType: filters.employmentType,
      workplaceType: filters.workplaceType,
      experienceLevel: filters.experienceLevel,
      sortBy: filters.sortBy,
      order: filters.order,
    });
  }, [filters]);

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

  const updateUrlFilters = (nextFilters, nextPage = 1) => {
    setSearchParams(createSearchParamsFromFilters(nextFilters, nextPage));
  };

  const handleDraftFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === "sort") {
      const selectedSort =
        SORT_OPTIONS.find((option) => option.value === value) ||
        SORT_OPTIONS[0];

      setDraftFilters((currentFilters) => ({
        ...currentFilters,
        sortBy: selectedSort.sortBy,
        order: selectedSort.order,
      }));

      return;
    }

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const applySearchAndFilters = () => {
    updateUrlFilters({
      search: searchInput.trim(),
      location: locationInput.trim(),
      employmentType: draftFilters.employmentType,
      workplaceType: draftFilters.workplaceType,
      experienceLevel: draftFilters.experienceLevel,
      sortBy: draftFilters.sortBy,
      order: draftFilters.order,
    });
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
    setSearchParams(new URLSearchParams());
    setIsFiltersOpen(false);
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === "sort") {
      updateUrlFilters({
        ...filters,
        sortBy: DEFAULT_FILTERS.sortBy,
        order: DEFAULT_FILTERS.order,
      });

      return;
    }

    updateUrlFilters({
      ...filters,
      [filterKey]: "",
    });
  };

  const handlePageChange = (nextPage) => {
    updateUrlFilters(filters, nextPage);
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
    <main className="bg-slate-50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto grid max-w-[1500px] gap-6">
        <PageHero
          eyebrow="Public jobs"
          title="Browse jobs"
          description="Search your preferred job by role, location, or skill."
        />

        <Card>
          <CardBody>
            <form onSubmit={handleSearchSubmit}>
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto_auto] lg:items-end">
                <FormField
                  label="What job are you looking for?"
                  htmlFor="search"
                >
                  <input
                    id="search"
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Frontend Developer, React, Node.js"
                    className={getInputClassName()}
                  />
                </FormField>

                <FormField label="Location" htmlFor="location">
                  <input
                    id="location"
                    type="search"
                    value={locationInput}
                    onChange={(event) => setLocationInput(event.target.value)}
                    placeholder="Pune, Mumbai, Remote"
                    className={getInputClassName()}
                  />
                </FormField>

                <Button type="submit" size="lg">
                  Search
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    setIsFiltersOpen((currentValue) => !currentValue)
                  }
                >
                  Filters
                  {activeAdvancedFilterCount > 0 && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {activeAdvancedFilterCount}
                    </span>
                  )}
                </Button>
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

                  <FilterSelect
                    id="sort"
                    label="Sort"
                    name="sort"
                    value={getSortOptionValue(draftFilters)}
                    onChange={handleDraftFilterChange}
                    options={SORT_OPTIONS}
                  />
                </div>

                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearFilters}
                  >
                    Clear all
                  </Button>

                  <Button type="button" onClick={handleApplyAdvancedFilters}>
                    Apply filters
                  </Button>
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
          </CardBody>
        </Card>

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
              <Card>
                <CardBody>
                  <p className="text-sm text-slate-600">Loading jobs...</p>
                </CardBody>
              </Card>
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
              <EmptyState
                icon="🔎"
                title="No jobs found"
                description="Try changing your search, location, or filters."
                action={
                  <Button type="button" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}

            {status === "success" && jobs.length > 0 && (
              <>
                <div className="grid gap-4">
                  {jobs.map((job) => (
                    <JobCard key={getJobId(job)} job={job} />
                  ))}
                </div>

                {pagination && (
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
                          onClick={() =>
                            handlePageChange(Math.max(page - 1, 1))
                          }
                        >
                          Previous
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!pagination.hasNextPage}
                          onClick={() => handlePageChange(page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </section>

          <aside className="grid gap-6 self-start">
            <CandidateChecklistCard />
            <SearchTipsCard />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default JobsPage;
