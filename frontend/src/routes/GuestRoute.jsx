import {
  Navigate,
  Outlet,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  getDashboardPathForRole,
} from "../features/auth/auth.utils";

const GuestRoute = () => {
  const {
    isAuthenticated,
    user,
  } = useAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to={getDashboardPathForRole(
          user?.role
        )}
        replace
      />
    );
  }

  return <Outlet />;
};

export default GuestRoute;