import CurrentUserCard from "../../components/auth/CurrentUserCard";

const CandidateDashboardPage = () => {
  return (
    <div className="grid gap-6">
      <section>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Candidate dashboard
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Welcome back
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Your applications, saved jobs, profile completion, and interview
          updates will appear here.
        </p>
      </section>

      <CurrentUserCard />
    </div>
  );
};

export default CandidateDashboardPage;
