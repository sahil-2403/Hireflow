import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { listMyApplications } from "../../api/application.api";

import getApiError from "../../utils/getApiError";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";

const APPLICATION_STATUS_OPTIONS = [
  {
    label: "All",
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

const SUMMARY_FETCH_LIMIT = 100;

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const getApplicationId = (application) => {
  return application._id || application.id;
};

const getAppliedDate = (application) => {
  return application.appliedAt || application.createdAt;
};

const getStatusCount = (applications, status) => {
  return applications.filter((application) => application.status === status)
    .length;
};

const getStatusDescription = (selectedStatus) => {
  if (!selectedStatus) {
    return "Showing all application statuses.";
  }

  const option = APPLICATION_STATUS_OPTIONS.find(
    (statusOption) => statusOption.value === selectedStatus,
  );

  return `Showing ${option?.label || selectedStatus} applications.`;
};

const getStatCardClasses = (tone) => {
  const toneClasses = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      value: "text-blue-700",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700",
      value: "text-violet-700",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      value: "text-emerald-700",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      value: "text-amber-700",
    },
  };

  return toneClasses[tone] || toneClasses.blue;
};

const StatCard = ({ icon, label, value, description, tone = "blue" }) => {
  const classes = getStatCardClasses(tone);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${classes.icon}`}
        >
          {icon}
        </div>

        <p className={`text-3xl font-black ${classes.value}`}>{value}</p>
      </div>

      <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">
        {label}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
};

const EmptyApplicationsState = ({ selectedStatus }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
        📄
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-950">
        No applications found
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {selectedStatus
          ? "No applications match this status yet."
          : "Once you apply to jobs, your applications will appear here."}
      </p>

      <Link
        to="/jobs"
        className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
      >
        Browse jobs
      </Link>
    </div>
  );
};

const ApplicationRow = ({ application }) => {
  return (
    <article className="grid gap-4 p-5 transition hover:bg-slate-50/80 lg:grid-cols-[1.4fr_1fr_auto_1fr] lg:items-center">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
          {(application.jobId?.title || "J").slice(0, 1)}
        </div>

        <div className="min-w-0">
          <p className="font-black text-slate-950">
            {application.jobId?.title || "Job title unavailable"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {application.jobId?.location || "Location unavailable"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">
          {application.companyId?.name || "Company unavailable"}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {application.companyId?.industry || "Industry unavailable"}
        </p>
      </div>

      <ApplicationStatusBadge status={application.status} />

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Applied on
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          {formatDate(getAppliedDate(application))}
        </p>
      </div>
    </article>
  );
};

const ApplicationActivityCard = ({ applications }) => {
  const recentApplications = applications.slice(0, 5);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Activity
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          Application activity
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Your latest application updates from this page.
        </p>
      </div>

      {recentApplications.length === 0 ? (
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">
            No activity to show yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentApplications.map((application) => (
            <div key={getApplicationId(application)} className="p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-sm">
                  📬
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    {application.jobId?.title || "Job title unavailable"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {application.companyId?.name || "Company unavailable"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ApplicationStatusBadge status={application.status} />

                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(getAppliedDate(application))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

const CandidateApplicationsPage = () => {
  const [status, setStatus] = useState("loading");

  const [applicationsData, setApplicationsData] = useState(null);

  const [summaryStatus, setSummaryStatus] = useState("loading");

  const [summaryApplications, setSummaryApplications] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [summaryErrorMessage, setSummaryErrorMessage] = useState("");

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

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplicationSummary = async () => {
      try {
        setSummaryStatus("loading");
        setSummaryErrorMessage("");

        const result = await listMyApplications({
          page: 1,
          limit: SUMMARY_FETCH_LIMIT,
        });

        if (shouldIgnore) {
          return;
        }

        setSummaryApplications(result.data?.applications ?? []);
        setSummaryStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setSummaryErrorMessage(normalizedError.message);
        setSummaryApplications([]);
        setSummaryStatus("error");
      }
    };

    fetchApplicationSummary();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  const handleStatusChange = (nextStatus) => {
    setSelectedStatus(nextStatus);
    setPage(1);
  };

  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination;

  const currentTotal = pagination?.total ?? applications.length;

  const summary = useMemo(() => {
    return {
      total: summaryApplications.length,
      screening: getStatusCount(summaryApplications, "screening"),
      interview: getStatusCount(summaryApplications, "interview"),
      offers:
        getStatusCount(summaryApplications, "offer") +
        getStatusCount(summaryApplications, "hired"),
    };
  }, [summaryApplications]);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Candidate applications
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              My applications
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Track the jobs you applied to and follow your application status.
            </p>
          </div>
        </div>
      </section>

      {summaryStatus === "error" && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          Application summary could not be loaded: {summaryErrorMessage}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="📄"
          label="Total applications"
          value={summaryStatus === "loading" ? "—" : summary.total}
          description="Applications loaded from your candidate account."
          tone="blue"
        />

        <StatCard
          icon="👀"
          label="Screening"
          value={summaryStatus === "loading" ? "—" : summary.screening}
          description="Applications currently being reviewed."
          tone="violet"
        />

        <StatCard
          icon="📅"
          label="Interviews"
          value={summaryStatus === "loading" ? "—" : summary.interview}
          description="Applications that have reached interview stage."
          tone="emerald"
        />

        <StatCard
          icon="🏆"
          label="Offers / hired"
          value={summaryStatus === "loading" ? "—" : summary.offers}
          description="Applications with offer or hired status."
          tone="amber"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Application history
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {currentTotal} application{currentTotal === 1 ? "" : "s"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {getStatusDescription(selectedStatus)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {APPLICATION_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs font-bold transition",
                      selectedStatus === option.value
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {status === "loading" && (
            <div className="p-5">
              <p className="text-sm text-slate-600">Loading applications...</p>
            </div>
          )}

          {status === "error" && (
            <div className="p-5">
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {errorMessage}
              </div>
            </div>
          )}

          {status === "success" && applications.length === 0 && (
            <div className="p-5">
              <EmptyApplicationsState selectedStatus={selectedStatus} />
            </div>
          )}

          {status === "success" && applications.length > 0 && (
            <>
              <div className="hidden grid-cols-[1.4fr_1fr_auto_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 lg:grid">
                <p>Job</p>
                <p>Company</p>
                <p>Status</p>
                <p>Applied</p>
              </div>

              <div className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <ApplicationRow
                    key={getApplicationId(application)}
                    application={application}
                  />
                ))}
              </div>

              {pagination && (
                <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages || 1} ·{" "}
                    {pagination.total} total
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={!pagination.hasPreviousPage}
                      onClick={() => setPage((currentPage) => currentPage - 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((currentPage) => currentPage + 1)}
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

        <ApplicationActivityCard applications={applications} />
      </div>
    </div>
  );
};

export default CandidateApplicationsPage;
