import { useEffect, useMemo, useRef, useState } from "react";

import {
  BriefcaseBusiness,
  Building2,
  FileText,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

import { ROLES } from "../../features/auth/auth.constants";

import { getDashboardPathForRole } from "../../features/auth/auth.utils";

import useAuth from "../../hooks/useAuth";
import useLogout from "../../hooks/useLogout";

import getRoleDisplayName from "../../utils/getRoleDisplayName";

import ProfileAvatar from "../common/ProfileAvatar";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getDisplayName = (user) => {
  return user?.firstName || user?.username || user?.email || "User";
};

const getDashboardNavLinksByRole = (role) => {
  if (role === ROLES.CANDIDATE) {
    return [
      {
        label: "Dashboard",
        path: "/candidate/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Profile",
        path: "/candidate/profile",
        icon: UserRound,
      },
      {
        label: "Resume",
        path: "/candidate/resume",
        icon: FileText,
      },
      {
        label: "Applications",
        path: "/candidate/applications",
        icon: BriefcaseBusiness,
      },
      {
        label: "Browse Jobs",
        path: "/jobs",
        icon: Search,
      },
    ];
  }

  if (role === ROLES.OWNER) {
    return [
      {
        label: "Dashboard",
        path: "/company/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Profile",
        path: "/company/my-profile",
        icon: UserRound,
      },
      {
        label: "Jobs",
        path: "/company/jobs",
        icon: BriefcaseBusiness,
      },
      {
        label: "Applications",
        path: "/company/applications",
        icon: FileText,
      },
      {
        label: "Company",
        path: "/company/profile",
        icon: Building2,
      },
      {
        label: "Recruiters",
        path: "/company/recruiters",
        icon: Users,
      },
    ];
  }

  if (role === ROLES.RECRUITER) {
    return [
      {
        label: "Dashboard",
        path: "/company/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Profile",
        path: "/company/my-profile",
        icon: UserRound,
      },
      {
        label: "Jobs",
        path: "/company/jobs",
        icon: BriefcaseBusiness,
      },
      {
        label: "Applications",
        path: "/company/applications",
        icon: FileText,
      },
    ];
  }

  return [];
};

const getPublicNavLinks = ({ isAuthenticated, role }) => {
  const links = [
    {
      label: "Home",
      path: "/",
      icon: House,
      end: true,
    },
    {
      label: "Jobs",
      path: "/jobs",
      icon: Search,
    },
  ];

  if (isAuthenticated) {
    links.push({
      label: "Dashboard",
      path: getDashboardPathForRole(role),
      icon: LayoutDashboard,
    });
  }

  return links;
};

const NavbarBrand = ({ to, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={[
        "inline-flex min-w-0",
        "shrink-0 items-center",
        "gap-2.5",
        "rounded-lg",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-blue-500",
        "focus-visible:ring-offset-2",
      ].join(" ")}
      aria-label="HireFlow home"
    >
      <span
        className={[
          "grid h-9 w-9",
          "shrink-0 place-items-center",
          "rounded-xl",
          "bg-blue-600",
          "text-base font-semibold",
          "text-white",
        ].join(" ")}
      >
        H
      </span>

      <span className="truncate text-lg font-semibold tracking-tight text-slate-950">
        HireFlow
      </span>
    </NavLink>
  );
};

const PublicNavbar = ({ variant = "public" }) => {
  const { isAuthenticated, user } = useAuth();

  const { logoutUser } = useLogout();

  const location = useLocation();

  const menuButtonRef = useRef(null);

  const closeButtonRef = useRef(null);

  const drawerRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboardNavbar = variant === "dashboard";

  const dashboardPath = getDashboardPathForRole(user?.role);

  const brandPath = isAuthenticated ? dashboardPath : "/";

  const navLinks = useMemo(() => {
    if (isDashboardNavbar) {
      return getDashboardNavLinksByRole(user?.role);
    }

    return getPublicNavLinks({
      isAuthenticated,
      role: user?.role,
    });
  }, [isDashboardNavbar, isAuthenticated, user?.role]);

  /*
   * Company dashboards have more links,
   * so they switch to drawer navigation
   * below the xl breakpoint.
   */
  const desktopNavigationClassName = isDashboardNavbar
    ? "hidden xl:flex"
    : "hidden md:flex";

  const desktopAccountClassName = isDashboardNavbar
    ? "hidden xl:flex"
    : "hidden md:flex";

  const mobileMenuClassName = isDashboardNavbar ? "xl:hidden" : "md:hidden";

  const closeMobileMenu = (restoreFocus = true) => {
    setIsMobileMenuOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        menuButtonRef.current?.focus();
      });
    }
  };

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const handleMenuToggle = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
      return;
    }

    openMobileMenu();
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);

    await logoutUser();
  };

  /*
   * Close the drawer after navigation.
   * Do not restore focus because the page
   * route itself has changed.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /*
   * Lock page scrolling while the mobile
   * navigation drawer is open.
   */
  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);

      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  /*
   * If the viewport becomes large enough
   * for desktop navigation, close the
   * mobile drawer automatically.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      isDashboardNavbar ? "(min-width: 1280px)" : "(min-width: 768px)",
    );

    const handleBreakpointChange = (event) => {
      if (event.matches) {
        setIsMobileMenuOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      mediaQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, [isDashboardNavbar]);

  const handleDrawerKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    if (event.key !== "Tab" || !drawerRef.current) {
      return;
    }

    const focusableElements = Array.from(
      drawerRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
    ).filter(
      (element) =>
        !element.hasAttribute("disabled") &&
        element.getAttribute("aria-hidden") !== "true",
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];

    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const getDesktopNavLinkClass = ({ isActive }) => {
    return [
      "inline-flex min-h-10",
      "items-center gap-2",
      "px-3 py-2",
      "text-sm font-medium",

      isActive
        ? ["border-b", "text-blue-700"].join(" ")
        : ["text-slate-600", "hover:text-blue-700"].join(" "),
    ].join(" ");
  };

  const getMobileNavLinkClass = ({ isActive }) => {
    return [
      "flex min-h-11",
      "items-center gap-3",
      "px-3 py-2.5",
      "text-sm font-medium",

      isActive
        ? ["border-b", "text-blue-700"].join(" ")
        : ["text-slate-700", "hover:text-blue-700"].join(" "),
    ].join(" ");
  };

  return (
    <>
      <header
        className={[
          "sticky top-0 z-40",
          "border-b",
          "border-slate-200",
          "bg-white/95",
          "backdrop-blur",
        ].join(" ")}
      >
        <a
          href="#main-content"
          className={[
            "sr-only",
            "focus:not-sr-only",
            "focus:fixed",
            "focus:left-4",
            "focus:top-3",
            "focus:z-70",
            "focus:rounded-lg",
            "focus:bg-slate-950",
            "focus:px-3",
            "focus:py-2",
            "focus:text-sm",
            "focus:font-medium",
            "focus:text-white",
          ].join(" ")}
        >
          Skip to main content
        </a>

        <div
          className={[
            "mx-auto flex h-16",
            "w-full max-w-350",
            "items-center",
            "justify-between",
            "gap-3 px-4",
            "sm:px-6",
            "lg:px-8",
          ].join(" ")}
        >
          <NavbarBrand to={brandPath} />

          <nav
            aria-label="Primary navigation"
            className={["items-center gap-1", desktopNavigationClassName].join(
              " ",
            )}
          >
            {navLinks.map((link) => {
              const LinkIcon = link.icon;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={getDesktopNavLinkClass}
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />

                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div
                className={["items-center gap-2", desktopAccountClassName].join(
                  " ",
                )}
              >
                <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
                  <ProfileAvatar user={user} size="xs" />

                  <div className="min-w-0">
                    <p className="max-w-36 truncate text-sm font-medium text-slate-900">
                      {getDisplayName(user)}
                    </p>

                    <p className="max-w-36 truncate text-xs leading-4 text-slate-500">
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className={[
                    "inline-flex min-h-10",
                    "items-center",
                    "justify-center",
                    "gap-2 rounded-lg",
                    "border",
                    "border-slate-200",
                    "bg-white",
                    "px-3 py-2",
                    "text-sm font-medium",
                    "text-slate-700",
                    "transition-colors",

                    "hover:bg-slate-50",
                    "hover:text-red-600",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",
                    "focus-visible:ring-offset-2",
                  ].join(" ")}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />

                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div
                className={["items-center gap-2", desktopAccountClassName].join(
                  " ",
                )}
              >
                <NavLink
                  to="/login"
                  className={[
                    "inline-flex min-h-10",
                    "items-center",
                    "justify-center",
                    "rounded-lg px-3 py-2",
                    "text-sm font-medium",
                    "text-slate-700",
                    "transition-colors",

                    "hover:bg-slate-100",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",
                    "focus-visible:ring-offset-2",
                  ].join(" ")}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={[
                    "inline-flex min-h-10",
                    "items-center",
                    "justify-center",
                    "rounded-lg",
                    "bg-blue-600",
                    "px-4 py-2",
                    "text-sm font-medium",
                    "text-white",
                    "transition-colors",

                    "hover:bg-blue-700",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",
                    "focus-visible:ring-offset-2",
                  ].join(" ")}
                >
                  Register
                </NavLink>
              </div>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              onClick={handleMenuToggle}
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className={[
                "grid h-11 w-11",
                "shrink-0 place-items-center",
                "rounded-xl",
                "border",
                "border-slate-200",
                "bg-white",
                "text-slate-700",
                "transition-colors",

                "hover:bg-slate-50",

                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-blue-500",
                "focus-visible:ring-offset-2",

                mobileMenuClassName,
              ].join(" ")}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            onClick={() => closeMobileMenu()}
          />

          <aside
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onKeyDown={handleDrawerKeyDown}
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top))",

              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
            className={[
              "absolute inset-y-0",
              "right-0 flex",
              "w-[min(88vw,360px)]",
              "min-w-0 flex-col",
              "border-l",
              "border-slate-200",
              "bg-white",
              "shadow-2xl",
              "shadow-slate-950/15",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-4">
              <NavbarBrand
                to={brandPath}
                onClick={() => closeMobileMenu(false)}
              />

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => closeMobileMenu()}
                aria-label="Close navigation menu"
                className={[
                  "grid h-11 w-11",
                  "shrink-0",
                  "place-items-center",
                  "rounded-xl",
                  "border",
                  "border-slate-200",
                  "bg-white",
                  "text-slate-700",
                  "transition-colors",

                  "hover:bg-slate-50",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-blue-500",
                ].join(" ")}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {isAuthenticated && (
                <div className="mb-4 flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <ProfileAvatar user={user} size="sm" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">
                      {getDisplayName(user)}
                    </p>

                    <p className="truncate text-xs leading-5 text-slate-500">
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                </div>
              )}

              <nav aria-label="Mobile navigation" className="grid gap-1">
                {navLinks.map((link) => {
                  const LinkIcon = link.icon;

                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end={link.end}
                      onClick={() => closeMobileMenu(false)}
                      className={getMobileNavLinkClass}
                    >
                      <LinkIcon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />

                      <span className="min-w-0 truncate">{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="my-4 border-t border-slate-200" />

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={[
                    "flex min-h-11",
                    "w-full items-center",
                    "gap-3 rounded-xl",
                    "px-3 py-2.5",
                    "text-sm font-medium",
                    "text-red-600",
                    "transition-colors",

                    "hover:bg-red-50",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-red-500",
                  ].join(" ")}
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Logout
                </button>
              ) : (
                <div className="grid gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => closeMobileMenu(false)}
                    className={[
                      "flex min-h-11",
                      "items-center",
                      "justify-center",
                      "gap-2 rounded-xl",
                      "border",
                      "border-slate-200",
                      "bg-white",
                      "px-4 py-2.5",
                      "text-sm font-medium",
                      "text-slate-700",

                      "hover:bg-slate-50",

                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-blue-500",
                    ].join(" ")}
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Login
                  </NavLink>

                  <NavLink
                    to="/register"
                    onClick={() => closeMobileMenu(false)}
                    className={[
                      "flex min-h-11",
                      "items-center",
                      "justify-center",
                      "gap-2 rounded-xl",
                      "bg-blue-600",
                      "px-4 py-2.5",
                      "text-sm font-medium",
                      "text-white",

                      "hover:bg-blue-700",

                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-blue-500",
                    ].join(" ")}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Create account
                  </NavLink>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default PublicNavbar;
