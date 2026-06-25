import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { getDashboardPathForRole } from "../../features/auth/auth.utils";

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = getDashboardPathForRole(user?.role);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          404
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/jobs"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Browse jobs
          </Link>

          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
