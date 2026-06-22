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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading candidate profile...</p>
      </section>
    );
  }

  if (status === "missing") {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
          Profile incomplete
        </p>

        <h2 className="text-xl font-bold text-slate-950">
          Create your candidate profile
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          You need a candidate profile before applying to jobs.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-700">
          Profile error
        </p>

        <p className="text-sm text-red-700">{errorMessage}</p>
      </section>
    );
  }

  const completion = getProfileCompletion(profile);

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Candidate profile
          </p>

          <h2 className="text-2xl font-bold text-slate-950">{fullName}</h2>

          <p className="mt-1 text-sm text-slate-600">
            {profile.headline || "No headline added yet"}
          </p>
        </div>

        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {completion.percentage}% complete
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${completion.percentage}%`,
          }}
        />
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {completion.completed} of {completion.total} profile sections completed
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-slate-500">Experience</p>

          <p className="mt-1 font-semibold capitalize text-slate-900">
            {profile.experienceLevel}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">Location</p>

          <p className="mt-1 font-semibold text-slate-900">
            {profile.location}
          </p>
        </div>
      </div>

      {profile.skills?.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-500">Skills</p>

          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CandidateProfileSummaryCard;
