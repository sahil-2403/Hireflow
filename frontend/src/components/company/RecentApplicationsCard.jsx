import { Clock3, Inbox } from "lucide-react";

import { Link } from "react-router-dom";

import { formatDate } from "../../utils/formatDate";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";

import Button from "../ui/Button";

import { Card, CardBody, CardHeader } from "../ui/Card";

import EmptyState from "../ui/EmptyState";

const RecentApplicationsCard = ({ applications }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Clock3 className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                Recent applications
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Latest applications received across your jobs.
              </p>
            </div>
          </div>

          <Button
            as={Link}
            to="/company/applications"
            variant="secondary"
            size="xs"
          >
            View all
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {applications.length === 0 ? (
          <EmptyState
            size="compact"
            icon={Inbox}
            title="No applications yet"
            description="Recent candidate applications will appear here."
          />
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className=" wrap-break-word text-sm font-semibold text-slate-950">
                        {candidateName || "Candidate unavailable"}
                      </p>

                      {application.candidateId?.headline && (
                        <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-500">
                          {application.candidateId.headline}
                        </p>
                      )}

                      <p className="mt-1.5  wrap-break-word text-xs font-medium leading-5 text-slate-600">
                        {application.jobId?.title || "Job unavailable"}
                      </p>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <ApplicationStatusBadge status={application.status} />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
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
