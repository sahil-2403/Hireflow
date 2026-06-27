import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import { getDashboardPathForRole } from "../features/auth/auth.utils";
import PageLoader from "../components/common/PageLoader";

const RoleRoute = ({ allowedRoles }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <PageLoader message="Preparing your dashboard..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
