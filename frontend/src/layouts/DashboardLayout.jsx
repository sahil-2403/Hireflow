import { NavLink, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";

import { ROLES } from "../features/auth/auth.constants";

const DashboardLayout = () => {
  const { user } = useAuth();

  const { logoutUser } = useLogout();

  const getSidebarLinkClass = ({ isActive }) => {
    return [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-900 hover:text-white",
    ].join(" ");
  };

  const isCandidate = user?.role === ROLES.CANDIDATE;

  const isCompanyUser =
    user?.role === ROLES.OWNER || user?.role === ROLES.RECRUITER;

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden bg-slate-950 p-6 text-white md:flex md:flex-col">
        <div>
          <NavLink
            to="/"
            className="mb-8 inline-block text-2xl font-extrabold tracking-tight"
          >
            HireFlow
          </NavLink>

          <nav className="grid gap-2">
            {isCandidate && (
              <>
                <NavLink
                  to="/candidate/dashboard"
                  className={getSidebarLinkClass}
                >
                  Candidate Dashboard
                </NavLink>

                <NavLink
                  to="/candidate/profile"
                  className={getSidebarLinkClass}
                >
                  Profile
                </NavLink>

                <NavLink to="/candidate/resume" className={getSidebarLinkClass}>
                  Resume
                </NavLink>

                <NavLink
                  to="/candidate/applications"
                  className={getSidebarLinkClass}
                >
                  Applications
                </NavLink>
              </>
            )}

            {isCompanyUser && (
              <>
                <NavLink
                  to="/company/dashboard"
                  className={getSidebarLinkClass}
                >
                  Company Dashboard
                </NavLink>

                <NavLink to="/company/jobs" className={getSidebarLinkClass}>
                  Jobs
                </NavLink>

                <NavLink
                  to="/company/applications"
                  className={getSidebarLinkClass}
                >
                  Applications
                </NavLink>

                {user?.role === ROLES.OWNER && (
                  <NavLink
                    to="/company/profile"
                    className={getSidebarLinkClass}
                  >
                    Company Profile
                  </NavLink>
                )}
              </>
            )}

            <NavLink to="/jobs" className={getSidebarLinkClass}>
              Public Jobs
            </NavLink>
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-800 pt-6">
          <p className="mb-1 text-sm font-medium text-white">
            {user?.username || user?.email}
          </p>

          <p className="mb-4 text-xs capitalize text-slate-400">{user?.role}</p>

          <button
            type="button"
            onClick={logoutUser}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-semibold text-slate-700">Dashboard</p>

            <p className="text-sm text-slate-500">
              Signed in as {user?.username || user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={logoutUser}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:hidden"
          >
            Logout
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
