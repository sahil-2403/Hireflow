const CandidateApplicationsSummaryCard = ({
  status,
  applicationsData,
  errorMessage,
}) => {
  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination ?? null;

  const totalApplications = pagination?.total ?? applications.length;

  const latestApplication = applications[0];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
        Applications
      </p>

      <h2 className="text-xl font-bold text-slate-950">Application summary</h2>

      {status === "loading" && (
        <p className="mt-4 text-sm text-slate-600">Loading applications...</p>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm text-red-700">{errorMessage}</p>
      )}

      {status === "success" && (
        <>
          <p className="mt-4 text-4xl font-bold text-slate-950">
            {totalApplications}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Total applications submitted
          </p>

          {latestApplication ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Latest application
              </p>

              <p className="mt-1 font-semibold text-slate-950">
                {latestApplication.jobId?.title || "Job title unavailable"}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {latestApplication.companyId?.name || "Company unavailable"}
              </p>

              <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                {latestApplication.status}
              </span>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              You have not applied to any jobs yet.
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default CandidateApplicationsSummaryCard;
