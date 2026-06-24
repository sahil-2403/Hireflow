const TopJobsCard = ({ status, jobs, errorMessage }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Top jobs</h2>

      <p className="mt-1 text-sm text-slate-600">
        Jobs ranked by application count.
      </p>

      {status === "loading" && (
        <p className="mt-5 text-sm text-slate-600">Loading top jobs...</p>
      )}

      {status === "error" && (
        <p className="mt-5 text-sm text-red-700">{errorMessage}</p>
      )}

      {status === "success" && jobs.length === 0 && (
        <p className="mt-5 text-sm text-slate-600">No jobs found yet.</p>
      )}

      {status === "success" && jobs.length > 0 && (
        <div className="mt-5 divide-y divide-slate-200">
          {jobs.map((job) => (
            <article key={job._id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{job.title}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {job.location} ·{" "}
                    <span className="capitalize">{job.status}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-950">
                    {job.applicationCount}
                  </p>

                  <p className="text-xs text-slate-500">applications</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TopJobsCard;
