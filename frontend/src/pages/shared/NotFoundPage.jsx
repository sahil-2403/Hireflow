import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogIn,
  SearchX,
} from "lucide-react";

import { Link } from "react-router-dom";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import { getDashboardPathForRole } from "../../features/auth/auth.utils";

import useAuth from "../../hooks/useAuth";

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = getDashboardPathForRole(user?.role);

  const primaryAction = isAuthenticated
    ? {
        to: dashboardPath || "/jobs",
        label: "Go to dashboard",
        icon: LayoutDashboard,
      }
    : {
        to: "/login",
        label: "Sign in",
        icon: LogIn,
      };

  const PrimaryActionIcon = primaryAction.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-350 items-center justify-center">
        <Card as="section" className="w-full max-w-2xl">
          <CardBody className="p-6 text-center sm:p-10">
            <Link
              to="/"
              className={[
                "mx-auto inline-flex",
                "w-fit items-center gap-2",
                "rounded-lg",
                "text-sm font-semibold",
                "text-blue-700",
                "transition-colors",
                "hover:text-blue-800",

                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-blue-500",
                "focus-visible:ring-offset-2",
              ].join(" ")}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                H
              </span>
              HireFlow
            </Link>

            <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </div>

            <p className="mt-5 text-xs font-medium leading-5 text-blue-700">
              Error 404
            </p>

            <h1 className="mt-1 text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9">
              Page not found
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              The page may have been removed, moved to another address, or may
              not be available to your account.
            </p>

            <div className="mx-auto mt-7 grid max-w-md gap-2 min-[420px]:grid-cols-2">
              <Button as={Link} to="/jobs" variant="secondary" fullWidth>
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                Browse jobs
              </Button>

              <Button as={Link} to={primaryAction.to} fullWidth>
                <PrimaryActionIcon className="h-4 w-4" aria-hidden="true" />

                {primaryAction.label}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
};

export default NotFoundPage;
