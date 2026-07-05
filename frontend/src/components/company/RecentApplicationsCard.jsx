import { Link } from "react-router-dom";

import Button from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const getStatusClassName = (status) => {
  const statusClasses = {
    applied: "bg-blue-50 text-blue-700 ring-blue-100",
    screening: "bg-violet-50 text-violet-700 ring-violet-100",
    interview: "bg-amber-50 text-amber-700 ring-amber-100",
    offer: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    hired: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    rejected: "bg-red-50 text-red-700 ring-red-100",
  };

  return [
    "rounded-full px-3 py-1 text-xs font-bold capitalize ring-1",
    statusClasses[status] || "bg-slate-100 text-slate-700 ring-slate-200",
  ].join(" ");
};

const RecentApplicationsCard = ({ applications }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Activity
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Recent applications
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Latest candidate applications received.
            </p>
          </div>

          <Button
            as={Link}
            to="/company/applications"
            variant="secondary"
            size="sm"
          >
            View all
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {applications.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-bold text-slate-800">
              No applications received yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Once candidates apply, their latest applications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">
                        {candidateName || "Candidate unavailable"}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {application.jobId?.title || "Job unavailable"}
                      </p>

                      {application.candidateId?.headline && (
                        <p className="mt-1 text-sm text-slate-500">
                          {application.candidateId.headline}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <span className={getStatusClassName(application.status)}>
                        {application.status}
                      </span>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {formatDate(application.appliedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default RecentApplicationsCard;
