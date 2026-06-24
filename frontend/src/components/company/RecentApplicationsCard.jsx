const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const RecentApplicationsCard = ({ applications }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Recent applications</h2>

      <p className="mt-1 text-sm text-slate-600">
        Latest candidate applications received.
      </p>

      {applications.length === 0 ? (
        <p className="mt-5 text-sm text-slate-600">
          No applications received yet.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-slate-200">
          {applications.map((application) => {
            const candidateName = [
              application.candidateId?.firstName,
              application.candidateId?.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                key={application._id}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {candidateName || "Candidate unavailable"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {application.jobId?.title || "Job unavailable"}
                    </p>

                    {application.candidateId?.headline && (
                      <p className="mt-1 text-sm text-slate-500">
                        {application.candidateId.headline}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                      {application.status}
                    </span>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(application.appliedAt)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentApplicationsCard;
