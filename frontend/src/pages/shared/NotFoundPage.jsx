import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { getDashboardPathForRole } from "../../features/auth/auth.utils";

const ActionLink = ({ to, children, variant = "primary" }) => {
  const baseClassName =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-4";

  const variantClassName = {
    primary:
      "bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-100",
  };

  return (
    <Link
      to={to}
      className={[baseClassName, variantClassName[variant]].join(" ")}
    >
      {children}
    </Link>
  );
};

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = getDashboardPathForRole(user?.role);

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-4 sm:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50 px-4 py-16 shadow-sm sm:min-h-[calc(100vh-3rem)] sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />

          <div className="relative rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-10 lg:p-12">
            <Link
              to="/"
              className="mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white">
                H
              </span>
              HireFlow
            </Link>

            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-blue-50 text-5xl font-black text-blue-700 ring-1 ring-blue-100 sm:h-32 sm:w-32 sm:text-6xl">
              404
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              Page not found
            </p>

            <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              This page is outside the hiring flow
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              The page you are looking for does not exist, may have been moved,
              or you may not have access to it.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ActionLink to="/jobs" variant="secondary">
                Browse jobs
              </ActionLink>

              {isAuthenticated ? (
                <ActionLink to={dashboardPath || "/jobs"}>
                  Go to dashboard
                </ActionLink>
              ) : (
                <ActionLink to="/login">Login</ActionLink>
              )}
            </div>

            <div className="mt-10 grid gap-3 border-t border-slate-100 pt-8 text-left sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">Candidates</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Browse jobs and track applications.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">Companies</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Manage jobs and review applicants.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">Recruiters</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Move candidates through stages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
