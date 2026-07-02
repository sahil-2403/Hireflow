import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getMyCandidateProfile } from "../../api/candidate.api";
import { listMyApplications } from "../../api/application.api";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";

import CandidateProfileSummaryCard from "../../components/candidate/CandidateProfileSummaryCard";
import CandidateResumeStatusCard from "../../components/candidate/CandidateResumeStatusCard";
import CandidateApplicationsSummaryCard from "../../components/candidate/CandidateApplicationsSummaryCard";

const getDisplayName = (user) => {
  return user?.firstName || user?.username || user?.email || "there";
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
};

const getStatusClass = (status) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus?.includes("shortlist")) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  if (normalizedStatus?.includes("interview")) {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  }

  if (normalizedStatus?.includes("reject")) {
    return "bg-red-50 text-red-700 ring-1 ring-red-100";
  }

  if (normalizedStatus?.includes("review")) {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  }

  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
};

const CandidateJobSearchCard = () => {
  return (
    <section className="flex min-h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-xl">
          🔎
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Job search
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">Browse jobs</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Explore open roles and apply when your profile and resume are ready.
        </p>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Link
          to="/jobs"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
        >
          Browse jobs
        </Link>
      </div>
    </section>
  );
};

const RecentApplicationsSection = ({
  status,
  applicationsData,
  errorMessage,
}) => {
  const applications = applicationsData?.applications ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Recent activity
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Recent applications
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Track the latest roles you have applied to.
          </p>
        </div>

        <Link
          to="/candidate/applications"
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          View all
        </Link>
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
        <div className="p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl">
            📄
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-950">
            No applications yet
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Start browsing jobs and your applications will appear here.
          </p>

          <Link
            to="/jobs"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Browse jobs
          </Link>
        </div>
      )}

      {status === "success" && applications.length > 0 && (
        <div className="divide-y divide-slate-100">
          {applications.slice(0, 5).map((application) => {
            const applicationId = application._id || application.id;

            return (
              <article
                key={applicationId}
                className="grid gap-4 p-5 transition hover:bg-slate-50/70 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center"
              >
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                    {(application.jobId?.title || "J").slice(0, 1)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">
                      {application.jobId?.title || "Job title unavailable"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {application.companyId?.name || "Company unavailable"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Applied on
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(application.createdAt || application.appliedAt)}
                  </p>
                </div>

                <span
                  className={[
                    "inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize",
                    getStatusClass(application.status),
                  ].join(" ")}
                >
                  {application.status || "Applied"}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

const CandidateDashboardPage = () => {
  const { user } = useAuth();

  const [profileState, setProfileState] = useState({
    status: "loading",
    profile: null,
    errorMessage: "",
  });

  const [applicationsState, setApplicationsState] = useState({
    status: "loading",
    applicationsData: null,
    errorMessage: "",
  });

  useEffect(() => {
    let shouldIgnore = false;

    const fetchProfile = async () => {
      try {
        const result = await getMyCandidateProfile();

        if (shouldIgnore) {
          return;
        }

        setProfileState({
          status: "success",
          profile: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (normalizedError.statusCode === 404) {
          setProfileState({
            status: "missing",
            profile: null,
            errorMessage: normalizedError.message,
          });

          return;
        }

        setProfileState({
          status: "error",
          profile: null,
          errorMessage: normalizedError.message,
        });
      }
    };

    const fetchApplications = async () => {
      try {
        const result = await listMyApplications({
          page: 1,
          limit: 5,
        });

        if (shouldIgnore) {
          return;
        }

        setApplicationsState({
          status: "success",
          applicationsData: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setApplicationsState({
          status: "error",
          applicationsData: null,
          errorMessage: normalizedError.message,
        });
      }
    };

    fetchProfile();
    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-sm">
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate dashboard
          </p>

          <div className="mt-3 max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {getDisplayName(user)}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Manage your profile, resume, applications, and job search from one
              clean workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CandidateProfileSummaryCard
          status={profileState.status}
          profile={profileState.profile}
          errorMessage={profileState.errorMessage}
        />

        <CandidateApplicationsSummaryCard
          status={applicationsState.status}
          applicationsData={applicationsState.applicationsData}
          errorMessage={applicationsState.errorMessage}
        />

        <CandidateResumeStatusCard
          status={profileState.status}
          profile={profileState.profile}
        />

        <CandidateJobSearchCard />
      </section>

      <RecentApplicationsSection
        status={applicationsState.status}
        applicationsData={applicationsState.applicationsData}
        errorMessage={applicationsState.errorMessage}
      />
    </div>
  );
};

export default CandidateDashboardPage;
