import { UserRoundSearch } from "lucide-react";

import { Link } from "react-router-dom";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";

import ProfileAvatar from "../common/ProfileAvatar";

import Button from "../ui/Button";

import { Card, CardBody, CardHeader } from "../ui/Card";

import EmptyState from "../ui/EmptyState";
import SectionError from "../ui/SectionError";
import Skeleton from "../ui/Skeleton";

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const TopApplicantsSkeleton = () => {
  return (
    <div aria-hidden="true" className="divide-y divide-slate-100">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56 max-w-full" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>

          <Skeleton className="h-9 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
};

const TopApplicantsByJobCard = ({
  status,
  applicants,
  errorMessage,
  onRetry,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <UserRoundSearch className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                Top applicants by job
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                The strongest current match from each recent job.
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
        {status === "loading" && <TopApplicantsSkeleton />}

        {status === "error" && (
          <SectionError
            compact
            title="Could not load top applicants"
            message={errorMessage}
            onRetry={onRetry}
          />
        )}

        {status === "success" && applicants.length === 0 && (
          <EmptyState
            size="compact"
            icon={UserRoundSearch}
            title="No top applicants yet"
            description="Top applicants will appear after applications have match data."
          />
        )}

        {status === "success" && applicants.length > 0 && (
          <div className="divide-y divide-slate-100">
            {applicants.map((item) => {
              const candidate = item.topApplicant?.candidate;

              const candidateUser = item.topApplicant?.candidateUser;

              const candidateName = getCandidateName(candidate);

              const canView = Boolean(
                item.job?._id && item.topApplicant?.applicationId,
              );

              return (
                <article
                  key={`${item.job?._id}-${item.topApplicant?.applicationId}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                    <div className="flex min-w-0 gap-3">
                      <ProfileAvatar
                        user={candidateUser}
                        name={candidateName}
                        size="sm"
                        fallbackClassName="bg-blue-50 text-blue-700"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="wrap-break-word text-sm font-semibold text-slate-950">
                            {candidateName}
                          </p>

                          {item.topApplicant?.status && (
                            <ApplicationStatusBadge
                              status={item.topApplicant.status}
                            />
                          )}
                        </div>

                        {candidate?.headline && (
                          <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-500">
                            {candidate.headline}
                          </p>
                        )}

                        <p className="mt-1.5 wrap-break-word text-xs font-medium leading-5 text-slate-600">
                          {item.job?.title || "Job unavailable"}
                        </p>
                      </div>
                    </div>

                    <MatchScoreBadge
                      match={item.topApplicant?.match}
                      size="sm"
                    />

                    {canView && (
                      <Button
                        as={Link}
                        to={`/company/applications/${item.job._id}/${item.topApplicant.applicationId}`}
                        variant="secondary"
                        size="xs"
                        className="w-full lg:w-auto"
                      >
                        View application
                      </Button>
                    )}
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
