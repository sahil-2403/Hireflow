import { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  LoaderCircle,
  LogIn,
  Search,
  Sparkles,
} from "lucide-react";

import { Link, useSearchParams } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";

import { listRecommendedJobs } from "../../api/recommendation.api";

import JobsSearchPanel from "../../components/jobs/JobsSearchPanel";
import PublicJobCard from "../../components/jobs/PublicJobCard";
import SuggestedJobsEnhancementCard from "../../components/jobs/SuggestedJobsEnhancementCard";

import PublicJobsListSkeleton from "../../components/loading/PublicJobsListSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";

import { ROLES } from "../../features/auth/auth.constants";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";

import {
  createSortValue,
  getOptionLabel,
  getSortOptionByFields,
  getValidOptionValue,
} from "../../utils/options";

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

  const isValidSort = SORT_OPTIONS.some(
    (option) => option.sortBy === sortBy && option.order === order,
  );

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

const RecommendationAccessNotice = ({
  isAuthenticated,
  onBrowsePublicJobs,
}) => {
  return (
    <Card variant="subtle">
      <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-5 text-slate-950">
              Suggested Jobs are available to candidate accounts
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isAuthenticated
                ? "Your current account can still browse every public job normally."
                : "Sign in as a candidate to see profile-based suggestions, or continue browsing public jobs."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row">
          {!isAuthenticated && (
            <Button as={Link} to="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={onBrowsePublicJobs}
          >
            Browse public jobs
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

const JobsPagination = ({ pagination, disabled, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-slate-600">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
        jobs
      </p>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !pagination.hasPreviousPage}
          onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !pagination.hasNextPage}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated, user } = useAuth();

  const searchParamsString = searchParams.toString();

  const filters = useMemo(
    () => getFiltersFromSearchParams(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );

  const page = useMemo(
    () => getPageFromSearchParams(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );

  const canUseRecommendations =
    isAuthenticated && user?.role === ROLES.CANDIDATE;

  const isRecommendedMode = filters.recommended && canUseRecommendations;

  const sortOptions = isRecommendedMode
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((option) => !option.recommendedOnly);

  const [status, setStatus] = useState("loading");

  const [jobsData, setJobsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [loadAttempt, setLoadAttempt] = useState(0);

  const [successfulRecommendedMode, setSuccessfulRecommendedMode] =
    useState(null);

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
          if (
            !value ||
            key === "sortBy" ||
            key === "order" ||
            key === "recommended"
          ) {
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

        setSuccessfulRecommendedMode(isRecommendedMode);

        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        /*
         * Preserve already-visible jobs
         * when a filter refresh fails.
         */
        setStatus("error");
      }
    };

    fetchJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [filters, page, isRecommendedMode, loadAttempt]);

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
        sortBy: isRecommendedMode ? "matchScore" : DEFAULT_FILTERS.sortBy,

        order: "desc",
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

  const handleModeChange = (shouldUseRecommendations) => {
    updateUrlFilters({
      ...filters,

      recommended: shouldUseRecommendations,

      sortBy: shouldUseRecommendations ? "matchScore" : DEFAULT_FILTERS.sortBy,

      order: "desc",
    });
  };

  const handlePageChange = (nextPage) => {
    updateUrlFilters(filters, nextPage);
  };

  const jobs = jobsData?.jobs ?? [];

  const pagination = jobsData?.pagination;

  const hasLoadedData = jobsData !== null;

  const isInitialLoading = status === "loading" && !hasLoadedData;

  const isUpdating = status === "loading" && hasLoadedData;

  const hasRefreshError = status === "error" && hasLoadedData;

  const displayedRecommendedMode = hasLoadedData
    ? (successfulRecommendedMode ?? false)
    : isRecommendedMode;

  const showRecommendationAccessNotice =
    filters.recommended && !canUseRecommendations;

  const activeFilterChips = useMemo(
    () => getActiveFilterChips(filters),
    [filters],
  );

  const activeAdvancedFilterCount = [
    filters.employmentType,
    filters.workplaceType,
    filters.experienceLevel,

    filters.sortBy !== "createdAt" || filters.order !== "desc" ? "sort" : "",
  ].filter(Boolean).length;

  const totalJobs = pagination?.total ?? jobs.length;

  return (
    <div className="grid gap-5">
      <PageHero
        title={
          displayedRecommendedMode
            ? "Jobs matched to your profile"
            : "Browse open jobs"
        }
        description={
          displayedRecommendedMode
            ? "Open roles ranked using your candidate profile and available Resume Insights."
            : "Search open roles by job title, skill, location, workplace type, or experience level."
        }
      />

      {showRecommendationAccessNotice && (
        <RecommendationAccessNotice
          isAuthenticated={isAuthenticated}
          onBrowsePublicJobs={() => handleRemoveFilter("recommended")}
        />
      )}

      <JobsSearchPanel
        key={searchParamsString}
        filters={filters}
        sortOptions={sortOptions}
        employmentTypes={EMPLOYMENT_TYPES}
        workplaceTypes={WORKPLACE_TYPES}
        experienceLevels={EXPERIENCE_LEVELS}
        activeAdvancedFilterCount={activeAdvancedFilterCount}
        activeFilterChips={activeFilterChips}
        canUseRecommendations={canUseRecommendations}
        isRecommendedMode={isRecommendedMode}
        getSortValue={getSortOptionValue}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRemoveFilter={handleRemoveFilter}
        onModeChange={handleModeChange}
      />

      {displayedRecommendedMode && jobsData && (
        <SuggestedJobsEnhancementCard enhancement={jobsData.aiEnhancement} />
      )}

      <section
        aria-labelledby="jobs-results-heading"
        aria-busy={isUpdating}
        className="grid gap-4"
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="jobs-results-heading"
              className="text-xl font-semibold leading-7 text-slate-950"
            >
              {hasLoadedData
                ? `${totalJobs} matching ${totalJobs === 1 ? "job" : "jobs"}`
                : "Matching jobs"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isUpdating && (
              <p
                role="status"
                className="inline-flex items-center gap-2 text-sm leading-6 text-slate-500"
              >
                <LoaderCircle
                  className="h-4 w-4 animate-spin "
                  aria-hidden="true"
                />
                Updating results
              </p>
            )}
          </div>
        </header>

        {isInitialLoading && <PublicJobsListSkeleton />}

        {status === "error" && (
          <SectionError
            compact={hasLoadedData}
            title={
              hasLoadedData ? "Could not update jobs" : "Could not load jobs"
            }
            message={
              hasLoadedData
                ? [errorMessage, "Previously loaded results are still shown."]
                    .filter(Boolean)
                    .join(" ")
                : errorMessage
            }
            onRetry={() =>
              setLoadAttempt((currentAttempt) => currentAttempt + 1)
            }
          />
        )}

        {hasLoadedData && jobs.length === 0 && !isInitialLoading && (
          <EmptyState
            size="compact"
            icon={Search}
            title="No jobs found"
            description="Try changing your keyword, location, or advanced filters."
            action={
              <Button type="button" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          />
        )}

        {hasLoadedData && jobs.length > 0 && (
          <>
            <div
              className={["grid gap-4", isUpdating ? "opacity-70" : ""].join(
                " ",
              )}
            >
              {jobs.map((job) => (
                <PublicJobCard
                  key={job._id || job.id}
                  job={job}
                  showMatch={displayedRecommendedMode}
                />
              ))}
            </div>

            <JobsPagination
              pagination={pagination}
              disabled={isUpdating || hasRefreshError}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      {!isAuthenticated && !showRecommendationAccessNotice && (
        <Card variant="subtle">
          <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <h2 className="text-sm font-semibold leading-5 text-slate-950">
                  Want personalised job suggestions?
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Create a candidate account, complete your profile, and
                  optionally generate AI Resume Insights.
                </p>
              </div>
            </div>

            <Button
              as={Link}
              to="/register"
              className="w-full shrink-0 sm:w-auto"
            >
              Create candidate account
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default JobsPage;
