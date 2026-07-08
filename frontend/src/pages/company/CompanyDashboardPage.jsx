import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  getCompanyHiringFunnel,
  getCompanyOverview,
  getCompanyTopJobs,
} from "../../api/analytics.api";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import PageHero from "../../components/ui/PageHero";

import CompanyMetricCard from "../../components/company/CompanyMetricCard";
import HiringFunnelCard from "../../components/company/HiringFunnelCard";
import TopJobsCard from "../../components/company/TopJobsCard";
import RecentApplicationsCard from "../../components/company/RecentApplicationsCard";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";

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
          status: isCompanyProfileMissingError(normalizedError)
            ? "company-missing"
            : "error",
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

  const metrics = [
    {
      label: "Total jobs",
      value: jobs.totalJobs,
      helperText: "All jobs created by your company",
      icon: "💼",
      tone: "blue",
    },
    {
      label: "Open jobs",
      value: jobs.openJobs,
      helperText: "Currently accepting applications",
      icon: "🟢",
      tone: "emerald",
    },
    {
      label: "Total applications",
      value: applications.totalApplications,
      helperText: "Applications received",
      icon: "📥",
      tone: "violet",
    },
    {
      label: "Unique candidates",
      value: applications.uniqueCandidates,
      helperText: "Different candidates who applied",
      icon: "👤",
      tone: "blue",
    },
    {
      label: "Closed jobs",
      value: jobs.closedJobs,
      helperText: "Jobs no longer open",
      icon: "🔒",
      tone: "slate",
    },
    {
      label: "Hired candidates",
      value: applications.hiredCandidates,
      helperText: "Applications marked as hired",
      icon: "✅",
      tone: "emerald",
    },
    {
      label: "Rejected applications",
      value: applications.rejectedApplications,
      helperText: "Applications marked as rejected",
      icon: "✕",
      tone: "red",
    },
    {
      label: "Active recruiters",
      value: activeRecruiters,
      helperText: "Recruiters currently active",
      icon: "🤝",
      tone: "amber",
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Company dashboard"
        title="Hiring workspace"
        description="Track jobs, applications, candidates, recruiters, and hiring performance from one place."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/company/jobs" variant="secondary">
              Manage jobs
            </Button>

            <Button as={Link} to="/company/applications">
              View applications
            </Button>
          </div>
        }
      />

      {overviewState.status === "loading" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">
              Loading company dashboard...
            </p>
          </CardBody>
        </Card>
      )}

      {overviewState.status === "company-missing" && (
        <CompanySetupRequired description="Create your company profile before using the company dashboard, jobs, applications, and recruiter tools." />
      )}

      {overviewState.status === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="font-bold text-red-700">
              Could not load company dashboard
            </p>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {overviewState.errorMessage}
            </p>
          </CardBody>
        </Card>
      )}

      {overviewState.status === "success" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <CompanyMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                helperText={metric.helperText}
                icon={metric.icon}
                tone={metric.tone}
              />
            ))}
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
