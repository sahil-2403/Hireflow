import { Link } from "react-router-dom";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";
import ProfileAvatar from "../common/ProfileAvatar";
import Button from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const TopApplicantsByJobCard = ({ status, applicants, errorMessage }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Match highlights
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Top applicants by latest jobs
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Highest match applicant from each recent job.
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
        {status === "loading" && (
          <p className="text-sm text-slate-600">Loading top applicants...</p>
        )}

        {status === "error" && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {status === "success" && applicants.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-bold text-slate-800">
              No top applicants yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Once applications have match data, top applicants will appear
              here.
            </p>
          </div>
        )}

        {status === "success" && applicants.length > 0 && (
          <div className="divide-y divide-slate-100">
            {applicants.map((item) => {
              const candidate = item.topApplicant?.candidate;
              const candidateUser = item.topApplicant?.candidateUser;
              const candidateName = getCandidateName(candidate);

              return (
                <article
                  key={`${item.job?._id}-${item.topApplicant?.applicationId}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <ProfileAvatar
                        user={candidateUser}
                        name={candidateName}
                        size="sm"
                        fallbackClassName="bg-blue-50 text-blue-700"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {candidateName}
                          </p>

                          {item.topApplicant?.status && (
                            <ApplicationStatusBadge
                              status={item.topApplicant.status}
                            />
                          )}
                        </div>

                        {candidate?.headline && (
                          <p className="mt-1 text-sm text-slate-500">
                            {candidate.headline}
                          </p>
                        )}

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Applied for: {item.job?.title || "Job unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
                      <MatchScoreBadge
                        match={item.topApplicant?.match}
                        size="sm"
                      />

                      {item.job?._id && item.topApplicant?.applicationId && (
                        <Button
                          as={Link}
                          to={`/company/applications/${item.job._id}/${item.topApplicant.applicationId}`}
                          variant="secondary"
                          size="sm"
                        >
                          View
                        </Button>
                      )}
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

export default TopApplicantsByJobCard;
