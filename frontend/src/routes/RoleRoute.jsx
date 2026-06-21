import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";

import { getDashboardPathForRole } from "../features/auth/auth.utils";

const RoleRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
