import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Pencil,
  Search,
  UsersRound,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import {
  listManagedJobApplications,
  viewManagedApplicationResume,
} from "../../api/application.api";

import CompanyCandidateComparisonCard from "../../components/ai/CompanyCandidateComparisonCard";

import CompanySuggestedShortlistCard from "../../components/ai/CompanySuggestedShortlistCard";

import CompanyApplicantRow from "../../components/company/CompanyApplicantRow";

import JobStatusBadge from "../../components/company/JobStatusBadge";

import CompanyJobApplicationsPageSkeleton from "../../components/loading/CompanyJobApplicationsPageSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import Pill from "../../components/ui/Pill";
import SectionError from "../../components/ui/SectionError";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";
import FilterChips from "../../components/ui/FilterChips";

import { APPLICATION_STATUS_FILTERS } from "../../features/applications/application.constants";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";
import openPdfBlob from "../../utils/openPdfBlob";
import { getOptionLabel, getSortOptionByValue } from "../../utils/options";
import formatJobMetadata from "../../utils/formatJobMetadata";

const SORT_OPTIONS = [
  {
    label: "Best match first",
    value: "matchScore:desc",
    sortBy: "matchScore",
    order: "desc",
  },
  {
    label: "Application latest",
    value: "appliedAt:desc",
    sortBy: "appliedAt",
    order: "desc",
  },
  {
    label: "Application oldest",
    value: "appliedAt:asc",
    sortBy: "appliedAt",
    order: "asc",
  },
  {
    label: "Candidate name A-Z",
    value: "candidateName:asc",
    sortBy: "candidateName",
    order: "asc",
  },
];

const getCandidateName = (candidate) => {
  return (
    [candidate?.firstName, candidate?.lastName].filter(Boolean).join(" ") ||
    "Candidate unavailable"
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

      label: getOptionLabel(
        APPLICATION_STATUS_FILTERS,
        selectedStatus,
        selectedStatus,
      ),
    });
  }

  if (sortValue !== SORT_OPTIONS[0].value) {
    chips.push({
      key: "sort",

      label: `Sort: ${
        getSortOptionByValue(SORT_OPTIONS, sortValue, SORT_OPTIONS[0]).label
      }`,
    });
  }

  return chips;
};

const JobPipelineHeader = ({ job, jobId }) => {
  return (
    <header
      className={[
        "flex min-w-0",
        "flex-col gap-5",
        "border-b",
        "border-slate-200",
        "pb-5",

        "lg:flex-row",
        "lg:items-end",
        "lg:justify-between",
      ].join(" ")}
    >
      <div className="min-w-0">
        <h1 className="mt-1 wrap-break-word text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9">
          {job?.title || "Applicant pipeline"}
        </h1>

        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <JobStatusBadge status={job?.status} />

          <Pill variant="slate" size="xs" className="normal-case">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />

            {job?.location || "Location unavailable"}
          </Pill>

          <Pill variant="slate" size="xs" className="normal-case">
            <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />

            {formatJobMetadata(job?.employmentType, "Employment unavailable")}
          </Pill>

          <Pill variant="slate" size="xs" className="normal-case">
            {formatJobMetadata(job?.workplaceType, "Workplace unavailable")}
          </Pill>

          <Pill variant="slate" size="xs" className="normal-case">
            {formatJobMetadata(job?.experienceLevel, "Level unavailable")}
          </Pill>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
        <Button
          as={Link}
          to={`/company/jobs/${jobId}/edit`}
          variant="secondary"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit job
        </Button>

        <Button as={Link} to={`/jobs/${jobId}`}>
          View job posting
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};

const PipelineMetric = ({ label, value, toneClassName }) => {
  return (
    <div className="min-w-0 bg-white px-4 py-3 sm:px-5">
      <p className="flex items-center gap-2 text-xs font-medium leading-5 text-slate-500">
        {toneClassName && (
          <span
            className={[
              "h-2 w-2",
              "shrink-0",
              "rounded-full",

              toneClassName,
            ].join(" ")}
          />
        )}

        {label}
      </p>

      <p className="mt-1 text-xl font-semibold leading-7 text-slate-950">
        {value || 0}
      </p>
    </div>
  );
};

const PipelineSummary = ({ summary }) => {
  const statusCounts = summary?.statusCounts || {};

  return (
    <Card>
      <CardBody className="p-0">
        <div className="grid gap-px overflow-hidden bg-slate-200 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <PipelineMetric
            label="Total applications"
            value={summary?.totalApplications}
          />

          <PipelineMetric
            label="New"
            value={statusCounts.applied}
            toneClassName="bg-sky-400"
          />

          <PipelineMetric
            label="Reviewing"
            value={statusCounts.screening}
            toneClassName="bg-amber-400"
          />

          <PipelineMetric
            label="Interview"
            value={statusCounts.interview}
            toneClassName="bg-blue-500"
          />

          <PipelineMetric
            label="Offered"
            value={statusCounts.offer}
            toneClassName="bg-teal-400"
          />

          <PipelineMetric
            label="Hired"
            value={statusCounts.hired}
            toneClassName="bg-emerald-500"
          />

          <PipelineMetric
            label="Rejected"
            value={statusCounts.rejected}
            toneClassName="bg-slate-400"
          />
        </div>
      </CardBody>
    </Card>
  );
};

const ApplicantPagination = ({ pagination, onPreviousPage, onNextPage }) => {
  if (!pagination || Number(pagination.totalPages || 1) <= 1) {
    return null;
  }

  return (
    <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs leading-5 text-slate-500">
        Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
        {pagination.total} applicants
      </p>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!pagination.hasPreviousPage}
          onClick={onPreviousPage}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!pagination.hasNextPage}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </footer>
  );
};

const CompanyJobApplicationsPage = () => {
  const { jobId } = useParams();

  const [requestStatus, setRequestStatus] = useState("loading");

  const [applicationsData, setApplicationsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [loadAttempt, setLoadAttempt] = useState(0);

  const [openingResumeId, setOpeningResumeId] = useState(null);

  const [activeAiPanelState, setActiveAiPanelState] = useState({
    jobId,
    panel: null,
  });

  const [comparisonSelectionState, setComparisonSelectionState] = useState({
    jobId: null,
    candidates: [],
  });

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
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

        const result = await listManagedJobApplications(jobId, params);

        if (shouldIgnore) {
          return;
        }

        setApplicationsData(result.data);

        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setRequestStatus("error");
      }
    };

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, page, selectedStatus, sortValue, search, loadAttempt]);

  const applications = applicationsData?.applications || [];

  const pagination = applicationsData?.pagination || null;

  const job = applicationsData?.job;

  const summary = applicationsData?.summary;

  const aiSuggestedShortlist = applicationsData?.aiSuggestedShortlist;

  const aiCandidateComparison = applicationsData?.aiCandidateComparison;

  const hasLoadedData = applicationsData !== null;

  const isInitialLoading = requestStatus === "loading" && !hasLoadedData;

  const isUpdating = requestStatus === "loading" && hasLoadedData;

  const activeFilterChips = useMemo(
    () =>
      getActiveFilterChips({
        search,
        selectedStatus,
        sortValue,
      }),
    [search, selectedStatus, sortValue],
  );

  const activeAiPanel =
    activeAiPanelState.jobId === jobId ? activeAiPanelState.panel : null;

  const selectedComparisonCandidates =
    comparisonSelectionState.jobId === jobId
      ? comparisonSelectionState.candidates
      : [];

  const eligibleComparisonIdSet = new Set(
    (aiCandidateComparison?.eligibleApplicationIds || []).map(String),
  );

  const selectedComparisonIdSet = new Set(
    selectedComparisonCandidates.map((candidate) => candidate.applicationId),
  );

  const maximumComparisonCandidates =
    Number(aiCandidateComparison?.maximumCandidates) || 0;

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setSearch(searchInput.trim());

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
    }

    if (filterKey === "status") {
      setSelectedStatus("");
    }

    if (filterKey === "sort") {
      setSortValue(SORT_OPTIONS[0].value);
    }

    setPage(1);
  };

  const handleToggleComparison = (application) => {
    const applicationId = String(application._id || application.id);

    if (!eligibleComparisonIdSet.has(applicationId)) {
      return;
    }

    setComparisonSelectionState((currentState) => {
      const currentCandidates =
        currentState.jobId === jobId ? currentState.candidates : [];

      const alreadySelected = currentCandidates.some(
        (candidate) => candidate.applicationId === applicationId,
      );

      if (alreadySelected) {
        return {
          jobId,

          candidates: currentCandidates.filter(
            (candidate) => candidate.applicationId !== applicationId,
          ),
        };
      }

      if (
        maximumComparisonCandidates < 2 ||
        currentCandidates.length >= maximumComparisonCandidates
      ) {
        return {
          jobId,

          candidates: currentCandidates,
        };
      }

      return {
        jobId,

        candidates: [
          ...currentCandidates,

          {
            applicationId,

            candidateName: getCandidateName(application.candidate),

            headline: application.candidate?.headline || null,

            match: application.match || null,
          },
        ],
      };
    });
  };

  const handleRemoveComparisonCandidate = (applicationId) => {
    setComparisonSelectionState((currentState) => {
      const currentCandidates =
        currentState.jobId === jobId ? currentState.candidates : [];

      return {
        jobId,

        candidates: currentCandidates.filter(
          (candidate) => candidate.applicationId !== applicationId,
        ),
      };
    });
  };

  const handleViewResume = async (application) => {
    const applicationId = String(application._id || application.id);

    try {
      setOpeningResumeId(applicationId);

      const resumeBlob = await viewManagedApplicationResume(applicationId);

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not open resume", {
        description: normalizedError.message,
      });
    } finally {
      setOpeningResumeId(null);
    }
  };

  if (isInitialLoading) {
    return <CompanyJobApplicationsPageSkeleton />;
  }

  if (requestStatus === "error" && !hasLoadedData) {
    return (
      <div className="grid gap-5">
        <Button
          as={Link}
          to="/company/applications"
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Application groups
        </Button>

        <SectionError
          title="Could not load applicants"
          message={errorMessage}
          onRetry={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <JobPipelineHeader job={job} jobId={jobId} />

      <PipelineSummary summary={summary} />

      <section className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-stretch">
        <CompanySuggestedShortlistCard
          key={`shortlist-${jobId}`}
          jobId={jobId}
          availability={aiSuggestedShortlist}
          isResultVisible={activeAiPanel === "shortlist"}
          resultsContainerId="company-ai-results"
          onResultVisibilityChange={(isVisible) =>
            setActiveAiPanelState({
              jobId,
              panel: isVisible ? "shortlist" : null,
            })
          }
        />

        <CompanyCandidateComparisonCard
          key={`comparison-${jobId}`}
          jobId={jobId}
          availability={aiCandidateComparison}
          selectedApplications={selectedComparisonCandidates}
          isResultVisible={activeAiPanel === "comparison"}
          resultsContainerId="company-ai-results"
          onResultVisibilityChange={(isVisible) =>
            setActiveAiPanelState({
              jobId,
              panel: isVisible ? "comparison" : null,
            })
          }
          onRemoveSelected={handleRemoveComparisonCandidate}
          onClearSelected={() =>
            setComparisonSelectionState({
              jobId,
              candidates: [],
            })
          }
        />
      </section>

      <div
        id="company-ai-results"
        aria-live="polite"
        className={activeAiPanel ? "min-w-0" : "hidden"}
      />

      {!activeAiPanel && (
        <Card>
          <CardBody className="p-0">
            <header className="border-b border-slate-100 p-4 sm:p-5">
              <form
                onSubmit={handleSearchSubmit}
                className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_220px_auto] lg:items-end"
              >
                <TextInput
                  id="applicant-search"
                  type="search"
                  label="Search applicants"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search candidates"
                />

                <SelectInput
                  id="applicant-status"
                  label="Status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value);

                    setPage(1);
                  }}
                  options={APPLICATION_STATUS_FILTERS}
                />

                <SelectInput
                  id="applicant-sort"
                  label="Sort"
                  value={sortValue}
                  onChange={(event) => {
                    setSortValue(event.target.value);

                    setPage(1);
                  }}
                  options={SORT_OPTIONS}
                />

                <div className="grid grid-cols-2 gap-2 lg:flex">
                  <Button type="submit">
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Search
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </div>
              </form>

              <FilterChips
                chips={activeFilterChips}
                onRemove={handleRemoveFilter}
                onClear={handleClearFilters}
                showDivider={false}
                className="mt-4"
              />

              {isUpdating && (
                <p
                  role="status"
                  className="mt-3 inline-flex items-center gap-2 text-xs leading-5 text-slate-500"
                >
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Updating applicants
                </p>
              )}
            </header>

            {requestStatus === "error" && (
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <SectionError
                  compact
                  title="Could not update applicants"
                  message={errorMessage}
                  onRetry={() =>
                    setLoadAttempt((currentAttempt) => currentAttempt + 1)
                  }
                />
              </div>
            )}

            {applications.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  size="compact"
                  icon={UsersRound}
                  title="No applicants found"
                  description={
                    activeFilterChips.length > 0
                      ? "No applicants match the current filters."
                      : "Applications will appear after candidates apply."
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
                    ) : null
                  }
                />
              </div>
            ) : (
              <>
                <div className="hidden border-b items-start border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 xl:grid xl:grid-cols-[0.4fr_1.4fr_1fr_0.4fr_1fr_auto] xl:gap-4">
                  <span>Compare</span>

                  <span>Candidate</span>

                  <span>Skills</span>

                  <span>Match</span>

                  <span>Applied</span>

                  <span className="text-right">Actions</span>
                </div>

                <div
                  className={[
                    "divide-y divide-slate-100",
                    "transition-opacity",

                    isUpdating ? "opacity-60" : "",
                  ].join(" ")}
                >
                  {applications.map((application) => {
                    const applicationId = String(
                      application._id || application.id,
                    );

                    const eligible = eligibleComparisonIdSet.has(applicationId);

                    const selected = selectedComparisonIdSet.has(applicationId);

                    const limitReached =
                      maximumComparisonCandidates > 0 &&
                      selectedComparisonCandidates.length >=
                        maximumComparisonCandidates;

                    return (
                      <CompanyApplicantRow
                        key={applicationId}
                        jobId={jobId}
                        application={application}
                        isComparisonEligible={eligible}
                        isSelectedForComparison={selected}
                        isComparisonDisabled={
                          !eligible ||
                          maximumComparisonCandidates < 2 ||
                          (limitReached && !selected)
                        }
                        isOpeningResume={openingResumeId === applicationId}
                        onToggleComparison={handleToggleComparison}
                        onViewResume={handleViewResume}
                      />
                    );
                  })}
                </div>
              </>
            )}

            <ApplicantPagination
              pagination={pagination}
              onPreviousPage={() =>
                setPage((currentPage) => Math.max(currentPage - 1, 1))
              }
              onNextPage={() => setPage((currentPage) => currentPage + 1)}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default CompanyJobApplicationsPage;
