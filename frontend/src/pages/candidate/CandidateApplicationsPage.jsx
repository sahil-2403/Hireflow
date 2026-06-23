import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { listMyApplications } from "../../api/application.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";

const APPLICATION_STATUS_OPTIONS = [
  {
    label: "All statuses",
    value: "",
  },
  {
    label: "Applied",
    value: "applied",
  },
  {
    label: "Screening",
    value: "screening",
  },
  {
    label: "Interview",
    value: "interview",
  },
  {
    label: "Offer",
    value: "offer",
  },
  {
    label: "Hired",
    value: "hired",
  },
  {
    label: "Rejected",
    value: "rejected",
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

const CandidateApplicationsPage = () => {
  const [status, setStatus] = useState("loading");

  const [applicationsData, setApplicationsData] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [page, setPage] = useState(1);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const params = {
          page,
          limit: 10,
        };

        if (selectedStatus) {
          params.status = selectedStatus;
        }

        const result = await listMyApplications(params);

        if (shouldIgnore) {
          return;
        }

        setApplicationsData(result.data);
        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setApplicationsData(null);
        setStatus("error");
      }
    };

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate applications
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            My applications
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track the jobs you applied to and follow your application status.
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Browse jobs
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Application history
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Filter applications by their current hiring status.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="applicationStatus"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Status
            </label>

            <select
              id="applicationStatus"
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {APPLICATION_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === "loading" && (
          <p className="mt-6 text-sm text-slate-600">Loading applications...</p>
        )}

        {status === "error" && (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && applications.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <h3 className="text-lg font-bold text-slate-950">
              No applications yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Once you apply to jobs, your applications will appear here.
            </p>

            <Link
              to="/jobs"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Find jobs
            </Link>
          </div>
        )}

        {status === "success" && applications.length > 0 && (
          <>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:grid">
                <p>Job</p>
                <p>Company</p>
                <p>Status</p>
                <p>Applied</p>
              </div>

              <div className="divide-y divide-slate-200">
                {applications.map((application) => (
                  <article
                    key={application._id}
                    className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {application.jobId?.title || "Job title unavailable"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {application.jobId?.location || "Location unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {application.companyId?.name || "Company unavailable"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {application.companyId?.industry ||
                          "Industry unavailable"}
                      </p>
                    </div>

                    <div>
                      <ApplicationStatusBadge status={application.status} />
                    </div>

                    <p className="text-sm text-slate-600">
                      {formatDate(
                        application.appliedAt || application.createdAt,
                      )}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {pagination && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
                  {pagination.total} total
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
    </div>
  );
};

export default CandidateApplicationsPage;
