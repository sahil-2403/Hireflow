import { Navigate, Outlet } from "react-router-dom";

import PageLoader from "../components/common/PageLoader";
import useAuth from "../hooks/useAuth";
import { getDashboardPathForRole } from "../features/auth/auth.utils";

const GuestRoute = () => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <PageLoader message="Checking your session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
