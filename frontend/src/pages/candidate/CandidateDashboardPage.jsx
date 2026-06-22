import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getMyCandidateProfile } from "../../api/candidate.api";

import { listMyApplications } from "../../api/application.api";

import getApiError from "../../utils/getApiError";

import CandidateProfileSummaryCard from "../../components/candidate/CandidateProfileSummaryCard";
import CandidateResumeStatusCard from "../../components/candidate/CandidateResumeStatusCard";
import CandidateApplicationsSummaryCard from "../../components/candidate/CandidateApplicationsSummaryCard";

const CandidateDashboardPage = () => {
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
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate dashboard
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage your profile, resume, applications, and job search from one
            place.
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Browse jobs
        </Link>
      </section>

      <CandidateProfileSummaryCard
        status={profileState.status}
        profile={profileState.profile}
        errorMessage={profileState.errorMessage}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CandidateResumeStatusCard
          status={profileState.status}
          profile={profileState.profile}
        />

        <CandidateApplicationsSummaryCard
          status={applicationsState.status}
          applicationsData={applicationsState.applicationsData}
          errorMessage={applicationsState.errorMessage}
        />
      </div>
    </div>
  );
};

export default CandidateDashboardPage;
