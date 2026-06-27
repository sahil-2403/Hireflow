import { Navigate, Outlet, useLocation } from "react-router-dom";

import PageLoader from "../components/common/PageLoader";

import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return <PageLoader message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
