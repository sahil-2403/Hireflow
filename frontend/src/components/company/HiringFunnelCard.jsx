import { Card, CardBody, CardHeader } from "../ui/Card";

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
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Pipeline
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Hiring funnel</h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Application counts across hiring stages.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-50 px-4 py-2 text-right ring-1 ring-violet-100">
            <p className="text-lg font-black text-violet-700">
              {totalApplications}
            </p>

            <p className="text-xs font-bold text-violet-600">total</p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {status === "loading" && (
          <p className="text-sm text-slate-600">Loading hiring funnel...</p>
        )}

        {status === "error" && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && funnel.length === 0 && (
          <p className="text-sm text-slate-600">
            No funnel data available yet.
          </p>
        )}

        {status === "success" && funnel.length > 0 && (
          <div className="grid gap-4">
            {funnel.map((item) => {
              const percentage =
                totalApplications > 0
                  ? Math.round((item.count / totalApplications) * 100)
                  : 0;

              return (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <p className="font-bold capitalize text-slate-800">
                      {STATUS_LABELS[item.status] || item.status}
                    </p>

                    <p className="font-semibold text-slate-500">
                      {item.count} · {percentage}%
                    </p>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
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
      </CardBody>
    </Card>
  );
};

export default HiringFunnelCard;
