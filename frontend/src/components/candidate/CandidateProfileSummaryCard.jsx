import { Link } from "react-router-dom";

const getProfileCompletion = (profile) => {
  if (!profile) {
    return {
      completed: 0,
      total: 6,
      percentage: 0,
    };
  }

  const checks = [
    Boolean(profile.firstName),
    Boolean(profile.lastName),
    Boolean(profile.experienceLevel),
    Boolean(profile.location),
    Boolean(profile.headline),
    Array.isArray(profile.skills) && profile.skills.length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
};

const CandidateProfileSummaryCard = ({ status, profile, errorMessage }) => {
  if (status === "loading") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Loading candidate profile...</p>
      </section>
    );
  }

  if (status === "missing") {
    return (
      <section className="flex min-h-full flex-col rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-xl">
            👤
          </div>

          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            Profile incomplete
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Create your profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            You need a candidate profile before applying to jobs.
          </p>
        </div>

        <div className="border-t border-amber-200/70 bg-amber-100/40 p-4">
          <Link
            to="/candidate/profile"
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            Create profile
          </Link>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-700">
          Profile error
        </p>

        <p className="text-sm text-red-700">{errorMessage}</p>
      </section>
    );
  }

  const completion = getProfileCompletion(profile);

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  return (
    <section className="flex min-h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl">
            👤
          </div>

          <div
            className="grid h-16 w-16 place-items-center rounded-full text-sm font-black text-blue-700"
            style={{
              background: `conic-gradient(#2563eb ${completion.percentage * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white">
              {completion.percentage}%
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Profile status
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {completion.percentage === 100 ? "Complete" : "In progress"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {fullName}
          {profile.headline ? ` · ${profile.headline}` : ""}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{
              width: `${completion.percentage}%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs font-medium text-slate-500">
          {completion.completed} of {completion.total} sections completed
        </p>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Link
          to="/candidate/profile"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Edit profile
        </Link>
      </div>
    </section>
  );
};

export default CandidateProfileSummaryCard;