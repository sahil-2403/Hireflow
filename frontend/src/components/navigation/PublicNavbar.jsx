import { NavLink } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useLogout from "../../hooks/useLogout";

import { getDashboardPathForRole } from "../../features/auth/auth.utils";

const PublicNavbar = () => {
  const { isAuthenticated, user } = useAuth();

  const { logoutUser } = useLogout();

  const getNavLinkClass = ({ isActive }) => {
    return [
      "text-sm font-medium transition-colors",
      isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600",
    ].join(" ");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center gap-6 px-4 py-4 sm:px-6 md:flex-nowrap md:py-0 lg:px-8">
        <NavLink
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-600"
        >
          HireFlow
        </NavLink>

        <nav className="order-3 flex w-full items-center gap-6 md:order-0 md:w-auto">
          <NavLink to="/" className={getNavLinkClass}>
            Home
          </NavLink>

          <NavLink to="/jobs" className={getNavLinkClass}>
            Jobs
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to={getDashboardPathForRole(user?.role)}
              className={getNavLinkClass}
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                {user?.username || user?.email}
              </span>

              <button
                type="button"
                onClick={logoutUser}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
