import { Route, Routes } from "react-router-dom";

import { ROLES } from "./features/auth/auth.constants";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

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
import CompanyDashboardPage from "./pages/company/CompanyDashboardPage";

import NotFoundPage from "./pages/shared/NotFoundPage";

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/jobs" element={<JobsPage />} />

        <Route path="/jobs/:jobId" element={<JobDetailsPage />} />

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
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
