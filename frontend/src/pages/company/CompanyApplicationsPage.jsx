import { useEffect, useMemo, useState } from "react";

import {
  listManagedApplications,
  updateManagedApplicationStatus,
  viewManagedApplicationResume,
} from "../../api/application.api";

import getApiError from "../../utils/getApiError";
import openPdfBlob from "../../utils/openPdfBlob";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import ProfileAvatar from "../../components/common/ProfileAvatar";

import {
  APPLICATION_STATUS_FILTERS,
  NEXT_APPLICATION_STATUSES,
  getApplicationStatusLabel,
} from "../../features/applications/application.constants";

const SORT_OPTIONS = [
  {
    label: "Newest first",
    value: "desc",
  },
  {
    label: "Oldest first",
    value: "asc",
  },
];

const getInputClassName = () => {
  return [
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  ].join(" ");
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const getChangedByLabel = (changedBy) => {
  if (!changedBy) {
    return "System";
  }

  if (typeof changedBy === "string") {
    return "User";
  }

  return changedBy.username || changedBy.email || "User";
};

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const getFilterLabel = (status) => {
  return APPLICATION_STATUS_FILTERS.find((option) => option.value === status)
    ?.label;
};

const getActiveFilterChips = ({ selectedStatus, order }) => {
  const chips = [];

  if (selectedStatus) {
    chips.push({
      key: "status",
      label: getFilterLabel(selectedStatus) || selectedStatus,
    });
  }

  if (order !== "desc") {
    chips.push({
      key: "order",
      label: "Oldest first",
    });
  }

  return chips;
};

const DetailItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
};

const CompanyApplicationsPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [applicationsData, setApplicationsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [order, setOrder] = useState("desc");

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);

  const [openingResumeApplicationId, setOpeningResumeApplicationId] =
    useState(null);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
      try {
        setRequestStatus("loading");
        setErrorMessage("");

        const params = {
          page,
          limit: 10,
          order,
        };

        if (selectedStatus) {
          params.status = selectedStatus;
        }

        const result = await listManagedApplications(params);

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
        setRequestStatus(
          isCompanyProfileMissingError(normalizedError)
            ? "company-missing"
            : "error",
        );
      }
    };

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, order, refreshKey]);

  const handleStatusFilterChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const handleOrderChange = (event) => {
    setOrder(event.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStatus("");
    setOrder("desc");
    setPage(1);
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === "status") {
      setSelectedStatus("");
      setPage(1);
      return;
    }

    if (filterKey === "order") {
      setOrder("desc");
      setPage(1);
    }
  };

  const handleChangeApplicationStatus = async (application, nextStatus) => {
    const confirmed = window.confirm(
      `Move this application from ${getApplicationStatusLabel(
        application.status,
      )} to ${getApplicationStatusLabel(nextStatus)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingApplicationId(application._id);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await updateManagedApplicationStatus(
        application._id,
        nextStatus,
      );

      setSuccessMessage(result.message);

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleViewResume = async (application) => {
    try {
      setErrorMessage("");
      setOpeningResumeApplicationId(application._id);

      const resumeBlob = await viewManagedApplicationResume(application._id);

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setOpeningResumeApplicationId(null);
    }
  };

  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination;

  const activeFilterChips = useMemo(() => {
    return getActiveFilterChips({
      selectedStatus,
      order,
    });
  }, [selectedStatus, order]);

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company applications"
        title="Manage applications"
        description="Review candidates, open resumes, read cover letters, and move applications through your hiring workflow."
      />

      {requestStatus !== "company-missing" && (
        <Card>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <FormField label="Application status" htmlFor="status">
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={handleStatusFilterChange}
                  className={getInputClassName()}
                >
                  {APPLICATION_STATUS_FILTERS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Sort" htmlFor="order">
                <select
                  id="order"
                  value={order}
                  onChange={handleOrderChange}
                  className={getInputClassName()}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <Button
                type="button"
                variant="secondary"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>

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
            <p className="text-sm text-slate-600">Loading applications...</p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "company-missing" && (
        <CompanySetupRequired description="Create your company profile before reviewing applications." />
      )}

      {requestStatus === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="font-bold text-red-700">
              Could not load applications
            </p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "success" && applications.length === 0 && (
        <EmptyState
          icon="📥"
          title="No applications found"
          description="Applications will appear here when candidates apply to your jobs."
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

      {requestStatus === "success" && applications.length > 0 && (
        <section className="grid gap-4">
          {applications.map((application) => {
            const candidate = application.candidateId;

            const nextStatuses =
              NEXT_APPLICATION_STATUSES[application.status] ?? [];

            return (
              <Card key={application._id}>
                <CardBody className="p-5 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr_1fr] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <ProfileAvatar
                          user={application.candidateUserId}
                          name={getCandidateName(candidate)}
                          size="md"
                          fallbackClassName="bg-blue-50 text-blue-700"
                        />

                        <div>
                          <h2 className="text-xl font-black text-slate-950">
                            {getCandidateName(candidate)}
                          </h2>

                          <div className="mt-1">
                            <ApplicationStatusBadge
                              status={application.status}
                            />
                          </div>
                        </div>
                      </div>

                      {candidate?.headline && (
                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          {candidate.headline}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-slate-500">
                        {candidate?.location || "Location unavailable"}
                        {" · "}
                        <span className="capitalize">
                          {candidate?.experienceLevel ||
                            "experience unavailable"}
                        </span>
                      </p>

                      {application.candidateUserId?.email && (
                        <p className="mt-2 text-sm text-slate-500">
                          {application.candidateUserId.email}
                        </p>
                      )}

                      {candidate?.skills?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 10).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {candidate?.resumeUrl && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="mt-5"
                          disabled={
                            openingResumeApplicationId === application._id
                          }
                          onClick={() => handleViewResume(application)}
                        >
                          {openingResumeApplicationId === application._id
                            ? "Opening resume..."
                            : "View resume"}
                        </Button>
                      )}
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-950">
                        Application details
                      </p>

                      <div className="mt-4 grid gap-4">
                        <DetailItem
                          label="Applied for"
                          value={application.jobId?.title || "Job unavailable"}
                        />

                        <DetailItem
                          label="Applied on"
                          value={formatDate(application.appliedAt)}
                        />

                        {application.reviewedBy && (
                          <DetailItem
                            label="Reviewed by"
                            value={
                              application.reviewedBy.username ||
                              application.reviewedBy.email
                            }
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                      <p className="text-sm font-bold text-slate-950">
                        Move application
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Current status:{" "}
                        <span className="font-bold">
                          {getApplicationStatusLabel(application.status)}
                        </span>
                      </p>

                      {nextStatuses.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-600">
                          No further status changes available.
                        </p>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {nextStatuses.map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              type="button"
                              size="sm"
                              variant={
                                nextStatus === "rejected" ? "danger" : "primary"
                              }
                              disabled={
                                updatingApplicationId === application._id
                              }
                              onClick={() =>
                                handleChangeApplicationStatus(
                                  application,
                                  nextStatus,
                                )
                              }
                            >
                              {updatingApplicationId === application._id
                                ? "Updating..."
                                : getApplicationStatusLabel(nextStatus)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
                    <section className="rounded-2xl bg-slate-50 p-4">
                      <h3 className="text-sm font-black text-slate-950">
                        Cover letter
                      </h3>

                      {application.coverLetter ? (
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {application.coverLetter}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No cover letter submitted.
                        </p>
                      )}
                    </section>

                    <section className="rounded-2xl bg-slate-50 p-4">
                      <h3 className="text-sm font-black text-slate-950">
                        Status history
                      </h3>

                      {application.statusHistory?.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {application.statusHistory.map(
                            (historyItem, index) => (
                              <div
                                key={`${historyItem.status}-${index}`}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <ApplicationStatusBadge
                                    status={historyItem.status}
                                  />

                                  <span className="text-xs text-slate-500">
                                    by{" "}
                                    {getChangedByLabel(historyItem.changedBy)}
                                  </span>
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                  {formatDateTime(
                                    historyItem.changedAt ||
                                      historyItem.createdAt,
                                  )}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No status history available.
                        </p>
                      )}
                    </section>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </section>
      )}

      {requestStatus === "success" && pagination && (
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
              {pagination.total} applications
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

export default CompanyApplicationsPage;
