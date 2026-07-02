import { useEffect, useMemo, useState } from "react";

import { NavLink, Outlet, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";

import { ROLES } from "../features/auth/auth.constants";

const Icon = ({ name, className = "h-4 w-4" }) => {
  const icons = {
    dashboard: (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h6v6h-6z" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </>
    ),
    briefcase: (
      <>
        <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
        <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M4 12h16" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M16 9h2a2 2 0 0 1 2 2v10" />
        <path d="M8 7h4" />
        <path d="M8 11h4" />
        <path d="M8 15h4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
};

const getDashboardPathForRole = (role) => {
  if (role === ROLES.CANDIDATE) {
    return "/candidate/dashboard";
  }

  if (role === ROLES.OWNER || role === ROLES.RECRUITER) {
    return "/company/dashboard";
  }

  return "/";
};

const getDisplayName = (user) => {
  return user?.firstName || user?.username || user?.email || "User";
};

const getInitials = (user) => {
  const displayName = getDisplayName(user);

  if (!displayName) {
    return "U";
  }

  const parts = displayName.replace("@", " ").split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
};

const getRoleBadgeClass = (role) => {
  const baseClass =
    "hidden rounded-xl border px-3 py-1.5 text-xs font-bold capitalize sm:inline-flex";

  if (role === ROLES.OWNER) {
    return `${baseClass} border-violet-200 bg-violet-50 text-violet-700`;
  }

  if (role === ROLES.RECRUITER) {
    return `${baseClass} border-blue-200 bg-blue-50 text-blue-700`;
  }

  return `${baseClass} border-blue-200 bg-blue-50 text-blue-700`;
};

const getNavLinksByRole = (role) => {
  if (role === ROLES.CANDIDATE) {
    return [
      {
        label: "Dashboard",
        path: "/candidate/dashboard",
        icon: "dashboard",
        end: true,
      },
      {
        label: "Profile",
        path: "/candidate/profile",
        icon: "user",
      },
      {
        label: "Resume",
        path: "/candidate/resume",
        icon: "document",
      },
      {
        label: "Applications",
        path: "/candidate/applications",
        icon: "briefcase",
      },
      {
        label: "Browse Jobs",
        path: "/jobs",
        icon: "search",
      },
    ];
  }

  if (role === ROLES.OWNER) {
    return [
      {
        label: "Dashboard",
        path: "/company/dashboard",
        icon: "dashboard",
        end: true,
      },
      {
        label: "Jobs",
        path: "/company/jobs",
        icon: "briefcase",
      },
      {
        label: "Applications",
        path: "/company/applications",
        icon: "document",
      },
      {
        label: "Company",
        path: "/company/profile",
        icon: "building",
      },
      {
        label: "Recruiters",
        path: "/company/recruiters",
        icon: "users",
      },
    ];
  }

  if (role === ROLES.RECRUITER) {
    return [
      {
        label: "Dashboard",
        path: "/company/dashboard",
        icon: "dashboard",
        end: true,
      },
      {
        label: "Jobs",
        path: "/company/jobs",
        icon: "briefcase",
      },
      {
        label: "Applications",
        path: "/company/applications",
        icon: "document",
      },
    ];
  }

  return [];
};

const getMobilePrimaryAction = (role) => {
  if (role === ROLES.CANDIDATE) {
    return {
      label: "Browse Jobs",
      path: "/jobs",
      icon: "search",
    };
  }

  if (role === ROLES.OWNER) {
    return {
      label: "Add Recruiter",
      path: "/company/recruiters",
      icon: "plus",
    };
  }

  if (role === ROLES.RECRUITER) {
    return {
      label: "Post Job",
      path: "/company/jobs/new",
      icon: "plus",
    };
  }

  return null;
};

const DashboardLayout = () => {
  const { user } = useAuth();

  const { logoutUser } = useLogout();

  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dashboardPath = getDashboardPathForRole(user?.role);

  const navLinks = useMemo(() => {
    return getNavLinksByRole(user?.role);
  }, [user?.role]);

  const mobilePrimaryAction = getMobilePrimaryAction(user?.role);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getNavLinkClass = ({ isActive }) => {
    return [
      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");
  };

  const getMobileNavLinkClass = ({ isActive }) => {
    return [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);

    await logoutUser();
  };

  const mobileNavLinks = navLinks.filter((link) => {
    if (user?.role !== ROLES.CANDIDATE) {
      return true;
    }

    return link.path !== mobilePrimaryAction?.path;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <NavLink
            to={dashboardPath}
            className="inline-flex shrink-0 items-center gap-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm shadow-blue-200">
              H
            </span>

            <span className="text-lg font-black tracking-tight text-slate-950">
              HireFlow
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={getNavLinkClass}
              >
                <Icon name={link.icon} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mobilePrimaryAction && (
              <NavLink
                to={mobilePrimaryAction.path}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 md:hidden"
              >
                <Icon name={mobilePrimaryAction.icon} className="h-3.5 w-3.5" />
                <span>{mobilePrimaryAction.label}</span>
              </NavLink>
            )}

            <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm lg:flex">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {getInitials(user)}
              </div>

              <div className="min-w-0">
                <p className="max-w-[140px] truncate text-sm font-bold text-slate-900">
                  {getDisplayName(user)}
                </p>

                <p className="text-xs capitalize text-slate-500">
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-red-600 lg:inline-flex"
            >
              Logout
            </button>

            <button
              type="button"
              onClick={() =>
                setIsMobileMenuOpen((currentValue) => !currentValue)
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
              aria-label="Toggle dashboard menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? "close" : "menu"} />
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="absolute right-4 top-[4.4rem] w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 md:hidden">
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {getInitials(user)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {getDisplayName(user)}
                  </p>

                  <p className="text-xs capitalize text-slate-500">
                    {user?.role}
                  </p>
                </div>
              </div>

              <nav className="grid gap-1">
                {mobileNavLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.end}
                    className={getMobileNavLinkClass}
                  >
                    <Icon name={link.icon} />
                    {link.label}
                  </NavLink>
                ))}

                <div className="my-1 border-t border-slate-200" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Icon name="logout" />
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
