import {
  CalendarDays,
  Eye,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
} from "lucide-react";

import { Link } from "react-router-dom";

import { formatShortDate } from "../../utils/formatDate";

import ApplicationStatusBadge from "../application/ApplicationStatusBadge";
import MatchScoreBadge from "../application/MatchScoreBadge";

import ProfileAvatar from "../common/ProfileAvatar";

import Button from "../ui/Button";
import Pill from "../ui/Pill";

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const getVisibleSkills = (candidate) => {
  return Array.isArray(candidate?.skills)
    ? candidate.skills.filter(Boolean).slice(0, 3)
    : [];
};

const CompanyApplicantRow = ({
  jobId,
  application,
  isComparisonEligible,
  isSelectedForComparison,
  isComparisonDisabled,
  isOpeningResume,
  onToggleComparison,
  onViewResume,
}) => {
  const applicationId = String(application._id || application.id);

  const candidate = application.candidate;

  const candidateUser = application.candidateUser;

  const candidateName = getCandidateName(candidate);

  const visibleSkills = getVisibleSkills(candidate);

  const remainingSkills = Math.max(
    (candidate?.skills?.length || 0) - visibleSkills.length,
    0,
  );

  const hasResume = Boolean(candidate?.resumeUrl);

  return (
    <article
      className={[
        "grid min-w-0 gap-4",
        "px-4 py-4",
        "sm:px-5",

        "xl:grid-cols-[88px_minmax(240px,1.2fr)_minmax(230px,0.8fr)_110px_120px_auto]",
        "xl:items-center",
      ].join(" ")}
    >
      <label
        className={[
          "inline-flex min-h-9",
          "w-fit self-start items-center gap-2",
          "rounded-lg",
          "text-xs font-medium",
          "text-slate-600",

          isComparisonDisabled
            ? "cursor-not-allowed opacity-45"
            : "cursor-pointer",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={isSelectedForComparison}
          disabled={isComparisonDisabled}
          onChange={() => onToggleComparison(application)}
          className="h-4 w-4 rounded border-slate-300 accent-violet-600"
        />
        Compare
        {!isComparisonEligible && (
          <span className="sr-only">Comparison unavailable</span>
        )}
      </label>

      <div className="flex min-w-0 items-start gap-3">
        <ProfileAvatar
          user={candidateUser}
          name={candidateName}
          size="md"
          fallbackClassName="bg-blue-50 text-blue-700"
        />

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 wrap-break-word text-sm font-semibold leading-5 text-slate-950">
              {candidateName}
            </h3>

            <ApplicationStatusBadge status={application.status} />
          </div>

          {candidate?.headline && (
            <p className="mt-1 wrap-break-word text-xs font-medium leading-5 text-slate-600">
              {candidate.headline}
            </p>
          )}

          <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

              <span className="wrap-break-word">
                {candidate?.location || "Location unavailable"}
              </span>
            </span>

            {candidate?.experienceLevel && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>

                <span className="capitalize">{candidate.experienceLevel}</span>
              </>
            )}
          </p>

          {candidateUser?.email && (
            <p className="mt-1 inline-flex min-w-0 items-start gap-1 text-xs leading-5 text-slate-500">
              <Mail
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />

              <span className="break-all">{candidateUser.email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <Pill key={skill} variant="blue" size="xs" className="normal-case">
            {skill}
          </Pill>
        ))}

        {remainingSkills > 0 && (
          <Pill variant="slate" size="xs" className="normal-case">
            +{remainingSkills}
          </Pill>
        )}

        {visibleSkills.length === 0 && (
          <span className="text-xs leading-5 text-slate-400">
            No skills listed
          </span>
        )}
      </div>

      <div>
        <MatchScoreBadge
          match={application.match}
          size="sm"
          showLabel={false}
        />
      </div>

      <div>
        <p className="inline-flex items-center gap-1 text-xs leading-5 text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Applied
        </p>

        <p className="mt-0.5 text-xs font-medium leading-5 text-slate-700">
          {formatShortDate(application.appliedAt)}
        </p>
      </div>

      <div
        className={[
          "grid grid-cols-2 gap-2",
          "border-t",
          "border-slate-100",
          "pt-3",

          "xl:flex",
          "xl:justify-end",
          "xl:border-t-0",
          "xl:pt-0",
        ].join(" ")}
      >
        <Button
          as={Link}
          to={`/company/applications/${jobId}/${applicationId}`}
          variant="secondary"
          size="sm"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Details
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={!hasResume || isOpeningResume}
          onClick={() => onViewResume(application)}
        >
          {isOpeningResume ? (
            <LoaderCircle
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}

          {isOpeningResume ? "Opening" : "Resume"}
        </Button>
      </div>
    </article>
  );
};

export default CompanyApplicantRow;
