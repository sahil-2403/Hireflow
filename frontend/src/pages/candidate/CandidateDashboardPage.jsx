import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getMyCandidateProfile } from "../../api/candidate.api";
import { listMyApplications } from "../../api/application.api";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";

import CandidateProfileSummaryCard from "../../components/candidate/CandidateProfileSummaryCard";
import CandidateResumeStatusCard from "../../components/candidate/CandidateResumeStatusCard";
import CandidateApplicationsSummaryCard from "../../components/candidate/CandidateApplicationsSummaryCard";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";

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
    <Card className="flex min-h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
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
      </CardBody>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Button as={Link} to="/jobs" fullWidth>
          Browse jobs
        </Button>
      </div>
    </Card>
  );
};

const AlertMessage = ({ children }) => {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {children}
    </div>
  );
};

const ApplicationStatusPill = ({ status }) => {
  return (
    <span
      className={[
        "inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize",
        getStatusClass(status),
      ].join(" ")}
    >
      {status || "Applied"}
    </span>
  );
};

const RecentApplicationRow = ({ application }) => {
  return (
    <article className="grid gap-4 p-5 transition hover:bg-slate-50/70 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
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
        <p className="text-sm font-medium text-slate-500">Applied on</p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {formatDate(application.createdAt || application.appliedAt)}
        </p>
      </div>

      <ApplicationStatusPill status={application.status} />
    </article>
  );
};

const RecentApplicationsSection = ({
  status,
  applicationsData,
  errorMessage,
}) => {
  const applications = applicationsData?.applications ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <Button as={Link} to="/candidate/applications" variant="secondary">
            View all
          </Button>
        </div>
      </CardHeader>

      {status === "loading" && (
        <CardBody>
          <p className="text-sm text-slate-600">Loading applications...</p>
        </CardBody>
      )}

      {status === "error" && (
        <CardBody>
          <AlertMessage>{errorMessage}</AlertMessage>
        </CardBody>
      )}

      {status === "success" && applications.length === 0 && (
        <CardBody>
          <EmptyState
            icon="📄"
            title="No applications yet"
            description="Start browsing jobs and your applications will appear here."
            action={
              <Button as={Link} to="/jobs">
                Browse jobs
              </Button>
            }
          />
        </CardBody>
      )}

      {status === "success" && applications.length > 0 && (
        <div className="divide-y divide-slate-100">
          {applications.slice(0, 5).map((application) => {
            const applicationId = application._id || application.id;

            return (
              <RecentApplicationRow
                key={applicationId}
                application={application}
              />
            );
          })}
        </div>
      )}
    </Card>
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
      <PageHero
        eyebrow="Candidate dashboard"
        title={`Welcome back, ${getDisplayName(user)}`}
        description="Manage your profile, resume, applications, and job search from one clean workspace."
      />

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
