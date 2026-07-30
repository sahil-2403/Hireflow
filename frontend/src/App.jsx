import { lazy } from "react";

import { Route, Routes } from "react-router-dom";

import { ROLES } from "./features/auth/auth.constants";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";

import GuestRoute from "./routes/GuestRoute";
import LazyRouteBoundary from "./routes/LazyRouteBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

/*
 * Public pages
 */
const HomePage = lazy(() => import("./pages/public/HomePage"));

const JobsPage = lazy(() => import("./pages/public/JobsPage"));

const JobDetailsPage = lazy(() => import("./pages/public/JobDetailsPage"));

/*
 * Authentication pages
 */
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));

const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));

const ForgotPasswordPage = lazy(
  () => import("./pages/auth/ForgotPasswordPage"),
);

const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));

const ResendVerificationPage = lazy(
  () => import("./pages/auth/ResendVerificationPage"),
);

/*
 * Candidate pages
 */
const CandidateDashboardPage = lazy(
  () => import("./pages/candidate/CandidateDashboardPage"),
);

const CandidateProfilePage = lazy(
  () => import("./pages/candidate/CandidateProfilePage"),
);

const CandidateResumePage = lazy(
  () => import("./pages/candidate/CandidateResumePage"),
);

const CandidateApplicationsPage = lazy(
  () => import("./pages/candidate/CandidateApplicationsPage"),
);

/*
 * Company pages
 */
const CompanyDashboardPage = lazy(
  () => import("./pages/company/CompanyDashboardPage"),
);

const CompanyJobsPage = lazy(() => import("./pages/company/CompanyJobsPage"));

const CompanyJobFormPage = lazy(
  () => import("./pages/company/CompanyJobFormPage"),
);

const CompanyApplicationsPage = lazy(
  () => import("./pages/company/CompanyApplicationsPage"),
);

const CompanyJobApplicationsPage = lazy(
  () => import("./pages/company/CompanyJobApplicationsPage"),
);

const CompanyApplicationDetailsPage = lazy(
  () => import("./pages/company/CompanyApplicationDetailsPage"),
);

const CompanyMyProfilePage = lazy(
  () => import("./pages/company/CompanyMyProfilePage"),
);

const CompanyProfilePage = lazy(
  () => import("./pages/company/CompanyProfilePage"),
);

const CompanyRecruitersPage = lazy(
  () => import("./pages/company/CompanyRecruitersPage"),
);

/*
 * Shared pages
 */
const NotFoundPage = lazy(() => import("./pages/shared/NotFoundPage"));

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<LazyRouteBoundary />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/jobs" element={<JobsPage />} />

          <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<LazyRouteBoundary />}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/register" element={<RegisterPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              path="/resend-verification"
              element={<ResendVerificationPage />}
            />
          </Route>

          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />

          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<LazyRouteBoundary />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.CANDIDATE]} />}>
              <Route
                path="/candidate/dashboard"
                element={<CandidateDashboardPage />}
              />

              <Route
                path="/candidate/profile"
                element={<CandidateProfilePage />}
              />

              <Route
                path="/candidate/resume"
                element={<CandidateResumePage />}
              />

              <Route
                path="/candidate/applications"
                element={<CandidateApplicationsPage />}
              />
            </Route>

            <Route
              element={
                <RoleRoute allowedRoles={[ROLES.OWNER, ROLES.RECRUITER]} />
              }
            >
              <Route
                path="/company/dashboard"
                element={<CompanyDashboardPage />}
              />

              <Route
                path="/company/my-profile"
                element={<CompanyMyProfilePage />}
              />

              <Route path="/company/jobs" element={<CompanyJobsPage />} />

              <Route
                path="/company/jobs/new"
                element={<CompanyJobFormPage />}
              />

              <Route
                path="/company/jobs/:jobId/edit"
                element={<CompanyJobFormPage />}
              />

              <Route
                path="/company/applications"
                element={<CompanyApplicationsPage />}
              />

              <Route
                path="/company/applications/:jobId"
                element={<CompanyJobApplicationsPage />}
              />

              <Route
                path="/company/applications/:jobId/:applicationId"
                element={<CompanyApplicationDetailsPage />}
              />

              <Route element={<RoleRoute allowedRoles={[ROLES.OWNER]} />}>
                <Route
                  path="/company/profile"
                  element={<CompanyProfilePage />}
                />

                <Route
                  path="/company/recruiters"
                  element={<CompanyRecruitersPage />}
                />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<LazyRouteBoundary />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
