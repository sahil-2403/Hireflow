import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  getCompanyHiringFunnel,
  getCompanyOverview,
  getCompanyTopJobs,
} from "../../api/analytics.api";

import getApiError from "../../utils/getApiError";

import CompanyMetricCard from "../../components/company/CompanyMetricCard";
import HiringFunnelCard from "../../components/company/HiringFunnelCard";
import TopJobsCard from "../../components/company/TopJobsCard";
import RecentApplicationsCard from "../../components/company/RecentApplicationsCard";

const CompanyDashboardPage = () => {
  const [overviewState, setOverviewState] = useState({
    status: "loading",
    data: null,
    errorMessage: "",
  });

  const [funnelState, setFunnelState] = useState({
    status: "loading",
    data: null,
    errorMessage: "",
  });

  const [topJobsState, setTopJobsState] = useState({
    status: "loading",
    jobs: [],
    errorMessage: "",
  });

  useEffect(() => {
    let shouldIgnore = false;

    const fetchOverview = async () => {
      try {
        const result = await getCompanyOverview();

        if (shouldIgnore) {
          return;
        }

        setOverviewState({
          status: "success",
          data: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setOverviewState({
          status: "error",
          data: null,
          errorMessage: normalizedError.message,
        });
      }
    };

    const fetchFunnel = async () => {
      try {
        const result = await getCompanyHiringFunnel();

        if (shouldIgnore) {
          return;
        }

        setFunnelState({
          status: "success",
          data: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setFunnelState({
          status: "error",
          data: null,
          errorMessage: normalizedError.message,
        });
      }
    };

    const fetchTopJobs = async () => {
      try {
        const result = await getCompanyTopJobs({
          limit: 5,
        });

        if (shouldIgnore) {
          return;
        }

        setTopJobsState({
          status: "success",
          jobs: result.data ?? [],
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setTopJobsState({
          status: "error",
          jobs: [],
          errorMessage: normalizedError.message,
        });
      }
    };

    fetchOverview();
    fetchFunnel();
    fetchTopJobs();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  const overview = overviewState.data;

  const jobs = overview?.jobs ?? {
    totalJobs: 0,
    openJobs: 0,
    closedJobs: 0,
  };

  const applications = overview?.applications ?? {
    totalApplications: 0,
    uniqueCandidates: 0,
    hiredCandidates: 0,
    rejectedApplications: 0,
  };

  const activeRecruiters = overview?.recruiters?.activeRecruiters ?? 0;

  const recentApplications = overview?.recentApplications ?? [];

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Company dashboard
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Hiring workspace
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track jobs, applications, candidates, recruiters, and hiring
            performance from one place.
          </p>

          {overview?.company?.name && (
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {overview.company.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/company/jobs"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage jobs
          </Link>

          <Link
            to="/company/applications"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View applications
          </Link>
        </div>
      </section>

      {overviewState.status === "loading" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading company dashboard...</p>
        </section>
      )}

      {overviewState.status === "error" && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="font-semibold text-red-700">
            Could not load company dashboard
          </p>

          <p className="mt-2 text-sm text-red-700">
            {overviewState.errorMessage}
          </p>
        </section>
      )}

      {overviewState.status === "success" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CompanyMetricCard
              label="Total jobs"
              value={jobs.totalJobs}
              helperText="All jobs created by your company"
            />

            <CompanyMetricCard
              label="Open jobs"
              value={jobs.openJobs}
              helperText="Currently accepting applications"
            />

            <CompanyMetricCard
              label="Total applications"
              value={applications.totalApplications}
              helperText="Applications received"
            />

            <CompanyMetricCard
              label="Unique candidates"
              value={applications.uniqueCandidates}
              helperText="Different candidates who applied"
            />

            <CompanyMetricCard
              label="Closed jobs"
              value={jobs.closedJobs}
              helperText="Jobs no longer open"
            />

            <CompanyMetricCard
              label="Hired candidates"
              value={applications.hiredCandidates}
              helperText="Applications marked as hired"
            />

            <CompanyMetricCard
              label="Rejected applications"
              value={applications.rejectedApplications}
              helperText="Applications marked as rejected"
            />

            <CompanyMetricCard
              label="Active recruiters"
              value={activeRecruiters}
              helperText="Recruiters currently active"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <HiringFunnelCard
              status={funnelState.status}
              funnelData={funnelState.data}
              errorMessage={funnelState.errorMessage}
            />

            <TopJobsCard
              status={topJobsState.status}
              jobs={topJobsState.jobs}
              errorMessage={topJobsState.errorMessage}
            />
          </div>

          <RecentApplicationsCard applications={recentApplications} />
        </>
      )}
    </div>
  );
};

export default CompanyDashboardPage;
