import { useEffect, useState } from "react";

import {
  listManagedApplications,
  updateManagedApplicationStatus,
} from "../../api/application.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";

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

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
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
        setRequestStatus("error");
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

  const handleChangeApplicationStatus = async (application, nextStatus) => {
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

  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Company applications
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Manage applications
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review candidates and move applications through your hiring workflow.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Application status
            </label>

            <select
              id="status"
              value={selectedStatus}
              onChange={handleStatusFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {APPLICATION_STATUS_FILTERS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="order"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Sort
            </label>

            <select
              id="order"
              value={order}
              onChange={handleOrderChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
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
          <p className="text-sm text-slate-600">Loading applications...</p>
        </section>
      )}

      {requestStatus === "error" && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="font-semibold text-red-700">
            Could not load applications
          </p>

          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      )}

      {requestStatus === "success" && applications.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            No applications found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Applications will appear here when candidates apply to your jobs.
          </p>
        </section>
      )}

      {requestStatus === "success" && applications.length > 0 && (
        <section className="grid gap-4">
          {applications.map((application) => {
            const candidate = application.candidateId;

            const nextStatuses =
              NEXT_APPLICATION_STATUSES[application.status] ?? [];

            return (
              <article
                key={application._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-950">
                        {getCandidateName(candidate)}
                      </h2>

                      <ApplicationStatusBadge status={application.status} />
                    </div>

                    {candidate?.headline && (
                      <p className="mt-2 text-sm text-slate-600">
                        {candidate.headline}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-500">
                      {candidate?.location || "Location unavailable"}
                      {" · "}
                      <span className="capitalize">
                        {candidate?.experienceLevel || "experience unavailable"}
                      </span>
                    </p>

                    {application.candidateUserId?.email && (
                      <p className="mt-2 text-sm text-slate-500">
                        {application.candidateUserId.email}
                      </p>
                    )}

                    {candidate?.resumeUrl && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View resume
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Applied for
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {application.jobId?.title || "Job unavailable"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Applied on {formatDate(application.appliedAt)}
                    </p>

                    {application.reviewedBy && (
                      <p className="mt-2 text-sm text-slate-500">
                        Reviewed by{" "}
                        {application.reviewedBy.username ||
                          application.reviewedBy.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Move application
                    </p>

                    {nextStatuses.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-600">
                        No further status changes available.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {nextStatuses.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            disabled={updatingApplicationId === application._id}
                            onClick={() =>
                              handleChangeApplicationStatus(
                                application,
                                nextStatus,
                              )
                            }
                            className={[
                              "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                              nextStatus === "rejected"
                                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
                            ].join(" ")}
                          >
                            {updatingApplicationId === application._id
                              ? "Updating..."
                              : getApplicationStatusLabel(nextStatus)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {candidate?.skills?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                    {candidate.skills.slice(0, 10).map((skill) => (
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
            );
          })}
        </section>
      )}

      {requestStatus === "success" && pagination && (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
            {pagination.total} applications
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

export default CompanyApplicationsPage;
