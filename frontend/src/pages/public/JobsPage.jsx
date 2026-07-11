import { useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";
import { listRecommendedJobs } from "../../api/recommendation.api";

import getApiError from "../../utils/getApiError";
import formatSalary from "../../utils/formatSalary";
import { formatRelativePostedDate } from "../../utils/formatDate";
import {
  createSortValue,
  getOptionLabel,
  getSortOptionByFields,
  getValidOptionValue,
} from "../../utils/options";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import FilterChips from "../../components/ui/FilterChips";
import Pill from "../../components/ui/Pill";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";
import Alert from "../../components/ui/Alert";

import CompanyLogo from "../../components/common/CompanyLogo";

import MatchScoreBadge from "../../components/application/MatchScoreBadge";

import { ROLES } from "../../features/auth/auth.constants";

import useAuth from "../../hooks/useAuth";

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
    label: "Best match first",
    sortBy: "matchScore",
    order: "desc",
    value: "matchScore:desc",
    recommendedOnly: true,
  },
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
  recommended: false,
};

const getSortOptionValue = (filters) => {
  const fallbackValue = createSortValue(
    DEFAULT_FILTERS.sortBy,
    DEFAULT_FILTERS.order,
  );

  return (
    getSortOptionByFields(SORT_OPTIONS, filters.sortBy, filters.order)?.value ||
    fallbackValue
  );
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
    recommended: searchParams.get("recommended") === "true",
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

    if (key === "recommended") {
      if (value) {
        params.set("recommended", "true");
      }

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

const getJobId = (job) => {
  return job._id || job.id;
};

const getSortLabel = (filters) => {
  return (
    getSortOptionByFields(SORT_OPTIONS, filters.sortBy, filters.order)?.label ||
    "Newest first"
  );
};

const getActiveFilterChips = (filters) => {
  const chips = [];

  if (filters.recommended) {
    chips.push({
      key: "recommended",
      label: "Suggested jobs",
    });
  }

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

const JobCard = ({ job, showMatch = false }) => {
  const jobId = getJobId(job);

  return (
    <Card
      as="article"
      className="p-0 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <CardBody>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <CompanyLogo
              company={job.companyId}
              name={job.companyId?.name || job.title}
              size="lg"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">
                  {job.title}
                </h2>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Open
                </span>

                {showMatch && job.match && (
                  <MatchScoreBadge match={job.match} size="sm" />
                )}
              </div>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {job.companyId?.name || "Company unavailable"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <Pill variant="slate" className="ring-0">
                  📍 {job.location || "Location unavailable"}
                </Pill>
                <Pill variant="slate" className="ring-0">
                  💼 {job.employmentType || "Employment unavailable"}
                </Pill>
                <Pill variant="slate" className="ring-0">
                  🏢 {job.workplaceType || "Workplace unavailable"}
                </Pill>
                <Pill variant="slate" className="ring-0">
                  ⭐ {job.experienceLevel || "Level unavailable"}
                </Pill>
              </div>

              <p className="mt-4 text-sm font-black text-slate-900">
                {formatSalary(job)}
              </p>

              {job.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.slice(0, 6).map((skill) => (
                    <Pill key={skill} variant="blue">
                      {skill}
                    </Pill>
                  ))}

                  {job.skills.length > 6 && (
                    <Pill>+{job.skills.length - 6}</Pill>
                  )}
                </div>
              )}

              {showMatch && job.match?.matchedSkills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Matched skills
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.match.matchedSkills.slice(0, 4).map((skill) => (
                      <Pill key={skill} variant="green">
                        {skill}
                      </Pill>
                    ))}

                    {job.match.matchedSkills.length > 4 && (
                      <Pill>+{job.match.matchedSkills.length - 4}</Pill>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <p className="text-xs font-semibold text-slate-500">
              {formatRelativePostedDate(job.createdAt)}
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

const JobsSearchControls = ({
  filters,
  sortOptions,
  activeAdvancedFilterCount,
  activeFilterChips,
  onApplyFilters,
  onClearFilters,
  onRemoveFilter,
}) => {
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
    onApplyFilters({
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
    onClearFilters();
    setIsFiltersOpen(false);
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSearchSubmit}>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto_auto] lg:items-end">
            <TextInput
              id="search"
              type="search"
              label="What job are you looking for?"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Frontend Developer, React, Node.js"
            />

            <TextInput
              id="location"
              type="search"
              label="Location"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Pune, Mumbai, Remote"
            />

            <Button type="submit" size="lg">
              Search
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setIsFiltersOpen((currentValue) => !currentValue)}
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
              <SelectInput
                id="employmentType"
                label="Employment"
                name="employmentType"
                value={draftFilters.employmentType}
                onChange={handleDraftFilterChange}
                options={EMPLOYMENT_TYPES}
              />

              <SelectInput
                id="workplaceType"
                label="Workplace"
                name="workplaceType"
                value={draftFilters.workplaceType}
                onChange={handleDraftFilterChange}
                options={WORKPLACE_TYPES}
              />

              <SelectInput
                id="experienceLevel"
                label="Experience"
                name="experienceLevel"
                value={draftFilters.experienceLevel}
                onChange={handleDraftFilterChange}
                options={EXPERIENCE_LEVELS}
              />

              <SelectInput
                id="sort"
                label="Sort"
                name="sort"
                value={getSortOptionValue(draftFilters)}
                onChange={handleDraftFilterChange}
                options={sortOptions}
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

        <FilterChips
          chips={activeFilterChips}
          onRemove={onRemoveFilter}
          onClear={handleClearFilters}
          className="mt-5"
        />
      </CardBody>
    </Card>
  );
};

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated, user } = useAuth();

  const searchParamsString = searchParams.toString();

  const filters = useMemo(() => {
    return getFiltersFromSearchParams(new URLSearchParams(searchParamsString));
  }, [searchParamsString]);

  const page = useMemo(() => {
    return getPageFromSearchParams(new URLSearchParams(searchParamsString));
  }, [searchParamsString]);

  const canUseRecommendations =
    isAuthenticated && user?.role === ROLES.CANDIDATE;

  const isRecommendedMode = filters.recommended && canUseRecommendations;

  const sortOptions = isRecommendedMode
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((option) => !option.recommendedOnly);

  const [status, setStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

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

        const result = isRecommendedMode
          ? await listRecommendedJobs(params)
          : await listPublicJobs(params);

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
  }, [filters, page, isRecommendedMode]);

  const updateUrlFilters = (nextFilters, nextPage = 1) => {
    setSearchParams(createSearchParamsFromFilters(nextFilters, nextPage));
  };

  const handleApplyFilters = (nextFilters) => {
    updateUrlFilters({
      ...nextFilters,
      recommended: isRecommendedMode,
    });
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
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

    if (filterKey === "recommended") {
      updateUrlFilters({
        ...filters,
        recommended: false,
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
    <div className="mx-auto grid max-w-375 gap-6">
      <PageHero
        eyebrow={isRecommendedMode ? "Suggested jobs" : "Public jobs"}
        title={
          isRecommendedMode ? "Jobs matched to your profile" : "Browse jobs"
        }
        description={
          isRecommendedMode
            ? "Open roles ranked using your skills, target roles, and job preferences."
            : "Search your preferred job by role, location, or skill."
        }
      />

      {filters.recommended && !canUseRecommendations && (
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">
                Login as a candidate to see suggested jobs.
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Guests and company users can still browse public jobs normally.
              </p>
            </div>

            <Button as={Link} to="/login">
              Login
            </Button>
          </CardBody>
        </Card>
      )}

      <JobsSearchControls
        key={searchParamsString}
        filters={filters}
        sortOptions={sortOptions}
        activeAdvancedFilterCount={activeAdvancedFilterCount}
        activeFilterChips={activeFilterChips}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

          {status === "error" && <Alert variant="error">{errorMessage}</Alert>}

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
                  <JobCard
                    key={getJobId(job)}
                    job={job}
                    showMatch={isRecommendedMode}
                  />
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
                        onClick={() => handlePageChange(Math.max(page - 1, 1))}
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
  );
};

export default JobsPage;
