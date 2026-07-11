import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { listManagedJobApplications } from "../../api/application.api";

import getApiError from "../../utils/getApiError";
import { formatDate } from "../../utils/formatDate";
import { getOptionLabel, getSortOptionByValue } from "../../utils/options";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";
import MatchScoreBadge from "../../components/application/MatchScoreBadge";
import JobStatusBadge from "../../components/company/JobStatusBadge";
import ProfileAvatar from "../../components/common/ProfileAvatar";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import Alert from "../../components/ui/Alert";
import FilterChips from "../../components/ui/FilterChips";
import Pill from "../../components/ui/Pill";
import SelectInput from "../../components/ui/SelectInput";
import TextInput from "../../components/ui/TextInput";

import { APPLICATION_STATUS_FILTERS } from "../../features/applications/application.constants";

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
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
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

const SummaryItem = ({ label, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
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
        setApplicationsData(null);
        setRequestStatus("error");
      }
    };

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, page, selectedStatus, sortValue, search]);

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

  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination;

  const job = applicationsData?.job;

  const summary = applicationsData?.summary;

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
        eyebrow="Job applications"
        title={job?.title || "Applications"}
        description="Review applicants for this job, sort by match quality, and move candidates through the hiring workflow."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/company/applications" variant="secondary">
              Back to application groups
            </Button>

            {job?._id && (
              <Button
                as={Link}
                to={`/company/jobs/${job._id}/edit`}
                variant="secondary"
              >
                Edit job
              </Button>
            )}
          </div>
        }
      />

      {requestStatus === "loading" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">Loading applicants...</p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "error" && (
        <Alert variant="error" title="Could not load applicants">
          {errorMessage}
        </Alert>
      )}

      {requestStatus === "success" && (
        <>
          <Card>
            <CardBody>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-slate-950">
                      {job?.title || "Job unavailable"}
                    </h2>

                    <JobStatusBadge status={job?.status} />
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {job?.location || "Location unavailable"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold capitalize text-slate-600">
                    <Pill variant="slate" className="ring-0">
                      {job?.employmentType || "Employment unavailable"}
                    </Pill>

                    <Pill variant="slate" className="ring-0">
                      {job?.workplaceType || "Workplace unavailable"}
                    </Pill>

                    <Pill variant="slate" className="ring-0">
                      {job?.experienceLevel || "Level unavailable"}
                    </Pill>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-110">
                  <SummaryItem
                    label="Applications"
                    value={summary?.totalApplications ?? 0}
                  />

                  <SummaryItem
                    label="Strong+ matches"
                    value={
                      (summary?.matchCounts?.excellent || 0) +
                      (summary?.matchCounts?.strong || 0)
                    }
                  />

                  <SummaryItem
                    label="In progress"
                    value={
                      (summary?.statusCounts?.screening || 0) +
                      (summary?.statusCounts?.interview || 0) +
                      (summary?.statusCounts?.offer || 0)
                    }
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <Card>
            <CardBody>
              <form
                onSubmit={handleSearchSubmit}
                className="grid gap-4 lg:grid-cols-[1.3fr_220px_240px_auto]"
              >
                <TextInput
                  id="search"
                  type="search"
                  label="Search applicants"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name, email, headline, or skill"
                />

                <SelectInput
                  id="status"
                  label="Status"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  options={APPLICATION_STATUS_FILTERS}
                />

                <SelectInput
                  id="sort"
                  label="Sort"
                  value={sortValue}
                  onChange={handleSortChange}
                  options={SORT_OPTIONS}
                />

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

                  <FilterChips
                    chips={activeFilterChips}
                    onRemove={handleRemoveFilter}
                    onClear={handleClearFilters}
                    className="mt-5"
                  />
                </div>
              )}
            </CardBody>
          </Card>

          {applications.length === 0 && (
            <EmptyState
              icon="👤"
              title="No applicants found"
              description="Try changing your filters or search query."
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

          {applications.length > 0 && (
            <section className="grid gap-4">
              {applications.map((application) => {
                const candidate = application.candidate;
                const candidateUser = application.candidateUser;
                const candidateName = getCandidateName(candidate);

                return (
                  <Card key={application._id}>
                    <CardBody className="p-5 sm:p-6">
                      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr_1fr_auto] lg:items-center">
                        <div className="flex gap-3 ">
                          <ProfileAvatar
                            user={candidateUser}
                            name={candidateName}
                            size="md"
                            fallbackClassName="bg-blue-50 text-blue-700"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-lg font-black text-slate-950">
                                {candidateName}
                              </h2>

                              <ApplicationStatusBadge
                                status={application.status}
                              />
                            </div>

                            {candidate?.headline && (
                              <p className="mt-1 text-sm font-semibold text-slate-700">
                                {candidate.headline}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-slate-500">
                              {candidate?.location || "Location unavailable"}
                              {" · "}
                              <span className="capitalize">
                                {candidate?.experienceLevel ||
                                  "experience unavailable"}
                              </span>
                            </p>

                            {candidateUser?.email && (
                              <p className="mt-1 text-sm text-slate-500">
                                {candidateUser.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mt-3 text-xs font-semibold text-slate-500">
                            Applied {formatDate(application.appliedAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Match score
                          </p>

                          <MatchScoreBadge match={application.match} />
                        </div>

                        <div className="flex lg:justify-end">
                          <Button
                            as={Link}
                            to={`/company/applications/${jobId}/${application._id}`}
                            size="sm"
                          >
                            Show details
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </section>
          )}

          {pagination && (
            <Card>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
                  {pagination.total} applicants
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
        </>
      )}
    </div>
  );
};

export default CompanyJobApplicationsPage;
