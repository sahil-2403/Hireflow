import { useEffect, useState } from "react";

import { BriefcaseBusiness, ClipboardList } from "lucide-react";

import { Link } from "react-router-dom";

import { listMyApplications } from "../../api/application.api";

import { getMyCandidateProfile } from "../../api/candidate.api";

import CandidateDashboardOverview, {
  CandidateAiWorkspaceCard,
} from "../../components/candidate/CandidateDashboardOverview";

import CandidateRecentApplications from "../../components/candidate/CandidateRecentApplications";

import Button from "../../components/ui/Button";
import PageHero from "../../components/ui/PageHero";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";

const getDisplayName = (user) => {
  return user?.firstName || user?.username || user?.email || "there";
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

  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);

  const [applicationsLoadAttempt, setApplicationsLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchProfile = async () => {
      setProfileState((currentState) => ({
        ...currentState,
        status: "loading",
        errorMessage: "",
      }));

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

    fetchProfile();

    return () => {
      shouldIgnore = true;
    };
  }, [profileLoadAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
      setApplicationsState((currentState) => ({
        ...currentState,
        status: "loading",
        errorMessage: "",
      }));

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

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [applicationsLoadAttempt]);

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Candidate dashboard"
        title={`Welcome back, ${getDisplayName(user)}`}
        description="Manage your profile, resume, applications, job recommendations, and AI-assisted preparation from one workspace."
        actions={
          <>
            <Button as={Link} to="/jobs">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              Browse jobs
            </Button>

            <Button as={Link} to="/candidate/applications" variant="secondary">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              My applications
            </Button>
          </>
        }
      />

      <CandidateDashboardOverview
        profileState={profileState}
        applicationsState={applicationsState}
        user={user}
        onRetryProfile={() =>
          setProfileLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
        onRetryApplications={() =>
          setApplicationsLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
      />

      <CandidateAiWorkspaceCard profileState={profileState} />

      <CandidateRecentApplications
        status={applicationsState.status}
        applicationsData={applicationsState.applicationsData}
        errorMessage={applicationsState.errorMessage}
        onRetry={() =>
          setApplicationsLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
      />
    </div>
  );
};

export default CandidateDashboardPage;
