import { Route, Routes } from "react-router-dom";

import { ROLES } from "./features/auth/auth.constants";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import GuestRoute from "./routes/GuestRoute";

import HomePage from "./pages/public/HomePage";
import JobsPage from "./pages/public/JobsPage";
import JobDetailsPage from "./pages/public/JobDetailsPage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ResendVerificationPage from "./pages/auth/ResendVerificationPage";

import CandidateDashboardPage from "./pages/candidate/CandidateDashboardPage";
import CandidateProfilePage from "./pages/candidate/CandidateProfilePage";
import CandidateResumePage from "./pages/candidate/CandidateResumePage";
import CandidateApplicationsPage from "./pages/candidate/CandidateApplicationsPage";

import CompanyDashboardPage from "./pages/company/CompanyDashboardPage";
import CompanyJobsPage from "./pages/company/CompanyJobsPage";
import CompanyJobFormPage from "./pages/company/CompanyJobFormPage";
import CompanyApplicationsPage from "./pages/company/CompanyApplicationsPage";
import CompanyJobApplicationsPage from "./pages/company/CompanyJobApplicationsPage";
import CompanyApplicationDetailsPage from "./pages/company/CompanyApplicationDetailsPage";
import CompanyMyProfilePage from "./pages/company/CompanyMyProfilePage";
import CompanyProfilePage from "./pages/company/CompanyProfilePage";
import CompanyRecruitersPage from "./pages/company/CompanyRecruitersPage";

import NotFoundPage from "./pages/shared/NotFoundPage";

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/jobs" element={<JobsPage />} />

        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/resend-verification"
            element={<ResendVerificationPage />}
          />
        </Route>

        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute allowedRoles={[ROLES.CANDIDATE]} />}>
            <Route
              path="/candidate/dashboard"
              element={<CandidateDashboardPage />}
            />

            <Route
              path="/candidate/profile"
              element={<CandidateProfilePage />}
            />

            <Route path="/candidate/resume" element={<CandidateResumePage />} />

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

            <Route path="/company/jobs/new" element={<CompanyJobFormPage />} />

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
              <Route path="/company/profile" element={<CompanyProfilePage />} />

              <Route
                path="/company/recruiters"
                element={<CompanyRecruitersPage />}
              />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
