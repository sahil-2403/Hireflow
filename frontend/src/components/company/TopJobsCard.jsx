import { Link } from "react-router-dom";

import Button from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import Alert from "../ui/Alert";

const TopJobsCard = ({ status, jobs, errorMessage }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Performance
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">Top jobs</h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jobs ranked by application count.
            </p>
          </div>

          <Button as={Link} to="/company/jobs" variant="secondary" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {status === "loading" && (
          <p className="text-sm text-slate-600">Loading top jobs...</p>
        )}

        {status === "error" && <Alert variant="error">{errorMessage}</Alert>}

        {status === "success" && jobs.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm font-bold text-slate-800">
              No jobs found yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create a job to start receiving applications.
            </p>
          </div>
        )}

        {status === "success" && jobs.length > 0 && (
          <div className="divide-y divide-slate-100">
            {jobs.map((job, index) => (
              <article key={job._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-bold text-slate-950">{job.title}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {job.location} ·{" "}
                        <span className="capitalize">{job.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950">
                      {job.applicationCount}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                      applications
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TopJobsCard;
