const STATUS_LABELS = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const HiringFunnelCard = ({ status, funnelData, errorMessage }) => {
  const totalApplications = funnelData?.totalApplications ?? 0;

  const funnel = funnelData?.funnel ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Hiring funnel</h2>

      <p className="mt-1 text-sm text-slate-600">
        Application counts across hiring stages.
      </p>

      {status === "loading" && (
        <p className="mt-5 text-sm text-slate-600">Loading hiring funnel...</p>
      )}

      {status === "error" && (
        <p className="mt-5 text-sm text-red-700">{errorMessage}</p>
      )}

      {status === "success" && (
        <div className="mt-5 grid gap-4">
          {funnel.map((item) => {
            const percentage =
              totalApplications > 0
                ? Math.round((item.count / totalApplications) * 100)
                : 0;

            return (
              <div key={item.status}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-medium capitalize text-slate-700">
                    {STATUS_LABELS[item.status] || item.status}
                  </p>

                  <p className="text-slate-500">
                    {item.count} · {percentage}%
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default HiringFunnelCard;
