import { Link } from "react-router-dom";
import ApiStatus from "../../components/common/ApiStatus";

const HomePage = () => {
  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6">
            <ApiStatus />
          </div>

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Modern hiring platform
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Find the right opportunity with HireFlow
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Browse open roles, manage applications and connect candidates with
            growing companies.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/jobs"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse Jobs
            </Link>

            <Link
              to="/register"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
