import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getMyCandidateProfile } from "../../api/candidate.api";
import { listMyApplications } from "../../api/application.api";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";
import { formatShortDate } from "../../utils/formatDate";

import CandidateProfileSummaryCard from "../../components/candidate/CandidateProfileSummaryCard";
import CandidateResumeStatusCard from "../../components/candidate/CandidateResumeStatusCard";
import CandidateApplicationsSummaryCard from "../../components/candidate/CandidateApplicationsSummaryCard";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import Alert from "../../components/ui/Alert";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";

const getDisplayName = (user) => {
  return user?.firstName || user?.username || user?.email || "there";
};

const CandidateJobSearchCard = () => {
  return (
    <Card className="flex min-h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl">
          🎯
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Suggested jobs
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Find roles that fit your profile
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          See open jobs ranked by skill overlap and your preferences.
        </p>
      </CardBody>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Button
          as={Link}
          to="/jobs?recommended=true&sortBy=matchScore&order=desc"
          fullWidth
        >
          View suggested jobs
        </Button>
      </div>
    </Card>
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
          {formatShortDate(application.createdAt || application.appliedAt)}
        </p>
      </div>

      <ApplicationStatusBadge status={application.status} />
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
          <Alert variant="error">{errorMessage}</Alert>
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
          user={user}
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
