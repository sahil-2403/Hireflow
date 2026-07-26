import { useEffect, useState } from "react";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Inbox,
  Layers3,
  LockKeyhole,
  MapPin,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  getCompanyHiringFunnel,
  getCompanyOverview,
  getCompanyTopApplicants,
  getCompanyTopJobs,
} from "../../api/analytics.api";

import CompanyMetricCard from "../../components/company/CompanyMetricCard";
import CompanySetupRequired from "../../components/company/CompanySetupRequired";
import HiringFunnelCard from "../../components/company/HiringFunnelCard";
import RecentApplicationsCard from "../../components/company/RecentApplicationsCard";
import TopApplicantsByJobCard from "../../components/company/TopApplicantsByJobCard";
import TopJobsCard from "../../components/company/TopJobsCard";

import CompanyLogo from "../../components/common/CompanyLogo";

import {
  CompanyMetricsSkeleton,
  CompanyWorkspaceSkeleton,
  RecentApplicationsSkeleton,
} from "../../components/loading/CompanyDashboardSkeletons";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";

import { ROLES } from "../../features/auth/auth.constants";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";

const createInitialState = (dataKey, initialData) => {
  return {
    status: "loading",
    [dataKey]: initialData,
    errorMessage: "",
  };
};

const CompanyWorkspaceCard = ({ company, canManageCompany = false }) => {
  if (!company) {
    return null;
  }

  const companyDetails = [company.industry, company.headquarters].filter(
    Boolean,
  );

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo
              company={company}
              size="lg"
              fallbackClassName="bg-blue-600 font-semibold text-white"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 shrink-0 text-blue-600"
                  aria-hidden="true"
                />

                <p className="text-xs font-medium text-blue-600">
                  Company workspace
                </p>
              </div>

              <h2 className="mt-1 wrap-break-word text-lg font-semibold leading-7 text-slate-950">
                {company.name}
              </h2>

              {companyDetails.length > 0 && (
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-slate-500">
                  {company.industry && <span>{company.industry}</span>}

                  {company.industry && company.headquarters && (
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                  )}

                  {company.headquarters && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />

                      {company.headquarters}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {canManageCompany && (
            <Button
              as={Link}
              to="/company/profile"
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              Edit company
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const CompanyDashboardPage = () => {
  const { user } = useAuth();

  const [overviewState, setOverviewState] = useState(
    createInitialState("data", null),
  );

  const [funnelState, setFunnelState] = useState(
    createInitialState("data", null),
  );

  const [topJobsState, setTopJobsState] = useState(
    createInitialState("jobs", []),
  );

  const [topApplicantsState, setTopApplicantsState] = useState(
    createInitialState("applicants", []),
  );

  const [overviewAttempt, setOverviewAttempt] = useState(0);

  const [funnelAttempt, setFunnelAttempt] = useState(0);

  const [topJobsAttempt, setTopJobsAttempt] = useState(0);

  const [topApplicantsAttempt, setTopApplicantsAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchOverview = async () => {
      setOverviewState(createInitialState("data", null));

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

    fetchOverview();

    return () => {
      shouldIgnore = true;
    };
  }, [overviewAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchFunnel = async () => {
      setFunnelState(createInitialState("data", null));

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

    fetchFunnel();

    return () => {
      shouldIgnore = true;
    };
  }, [funnelAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchTopJobs = async () => {
      setTopJobsState(createInitialState("jobs", []));

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

    fetchTopJobs();

    return () => {
      shouldIgnore = true;
    };
  }, [topJobsAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchTopApplicants = async () => {
      setTopApplicantsState(createInitialState("applicants", []));

      try {
        const result = await getCompanyTopApplicants({
          limit: 5,
        });

        if (shouldIgnore) {
          return;
        }

        setTopApplicantsState({
          status: "success",

          applicants: result.data ?? [],

          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setTopApplicantsState({
          status: "error",
          applicants: [],
          errorMessage: normalizedError.message,
        });
      }
    };

    fetchTopApplicants();

    return () => {
      shouldIgnore = true;
    };
  }, [topApplicantsAttempt]);

  const overview = overviewState.data;

  const company = overview?.company;

  const canManageCompany = user?.role === ROLES.OWNER;

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

  const primaryMetrics = [
    {
      label: "Open jobs",
      value: jobs.openJobs,
      helperText: "Currently accepting applications",
      icon: BriefcaseBusiness,
      tone: "blue",
    },
    {
      label: "Total applications",
      value: applications.totalApplications,
      helperText: "Applications received",
      icon: Inbox,
      tone: "violet",
    },
    {
      label: "Unique candidates",
      value: applications.uniqueCandidates,
      helperText: "Different candidates who applied",
      icon: Users,
      tone: "blue",
    },
    {
      label: "Hired candidates",
      value: applications.hiredCandidates,
      helperText: "Applications marked as hired",
      icon: UserCheck,
      tone: "emerald",
    },
  ];

  const secondaryMetrics = [
    {
      label: "Total jobs",
      value: jobs.totalJobs,
      icon: Layers3,
      tone: "blue",
    },
    {
      label: "Closed jobs",
      value: jobs.closedJobs,
      icon: LockKeyhole,
      tone: "slate",
    },
    {
      label: "Rejected",
      value: applications.rejectedApplications,
      icon: UserX,
      tone: "red",
    },
    {
      label: "Active recruiters",
      value: activeRecruiters,
      icon: BadgeCheck,
      tone: "amber",
    },
  ];

  const isCompanyMissing = overviewState.status === "company-missing";

  return (
    <div className="grid gap-5">
      <PageHero
        title="Overview of your hiring activity"
        description="Track jobs, applications, candidates, and hiring progress from one place."
      />

      {isCompanyMissing ? (
        <CompanySetupRequired description="Create your company profile before using dashboard, job, application, and recruiter tools." />
      ) : (
        <>
          {overviewState.status === "loading" && (
            <>
              <CompanyWorkspaceSkeleton />

              <CompanyMetricsSkeleton />
            </>
          )}

          {overviewState.status === "error" && (
            <SectionError
              title="Could not load dashboard overview"
              message={overviewState.errorMessage}
              onRetry={() =>
                setOverviewAttempt((currentAttempt) => currentAttempt + 1)
              }
            />
          )}

          {overviewState.status === "success" && (
            <>
              <CompanyWorkspaceCard
                company={company}
                canManageCompany={canManageCompany}
              />

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  {primaryMetrics.map((metric) => (
                    <CompanyMetricCard key={metric.label} {...metric} />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  {secondaryMetrics.map((metric) => (
                    <CompanyMetricCard key={metric.label} {...metric} compact />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <HiringFunnelCard
              status={funnelState.status}
              funnelData={funnelState.data}
              errorMessage={funnelState.errorMessage}
              onRetry={() =>
                setFunnelAttempt((currentAttempt) => currentAttempt + 1)
              }
            />

            <TopJobsCard
              status={topJobsState.status}
              jobs={topJobsState.jobs}
              errorMessage={topJobsState.errorMessage}
              onRetry={() =>
                setTopJobsAttempt((currentAttempt) => currentAttempt + 1)
              }
            />
          </div>

          <TopApplicantsByJobCard
            status={topApplicantsState.status}
            applicants={topApplicantsState.applicants}
            errorMessage={topApplicantsState.errorMessage}
            onRetry={() =>
              setTopApplicantsAttempt((currentAttempt) => currentAttempt + 1)
            }
          />

          {overviewState.status === "loading" && <RecentApplicationsSkeleton />}

          {overviewState.status === "success" && (
            <RecentApplicationsCard applications={recentApplications} />
          )}
        </>
      )}
    </div>
  );
};

export default CompanyDashboardPage;
