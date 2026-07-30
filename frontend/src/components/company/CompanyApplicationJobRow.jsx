import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { formatShortDate } from "../../utils/formatDate";

import MatchScoreBadge from "../application/MatchScoreBadge";

import JobStatusBadge from "./JobStatusBadge";

import Button from "../ui/Button";
import Pill from "../ui/Pill";

const CompanyApplicationJobRow = ({ job }) => {
  const jobId = job._id || job.id;

  const applicationCount = job.applicationCount || 0;

  return (
    <article className="grid min-w-0 gap-5 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 wrap-break-word text-base font-semibold leading-6 text-slate-950">
            {job.title || "Untitled job"}
          </h3>

          <JobStatusBadge status={job.status} />
        </div>

        <p className="mt-2 inline-flex min-w-0 items-start gap-1.5 text-sm leading-5 text-slate-600">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />

          <span className="wrap-break-word">
            {job.location || "Location unavailable"}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Pill variant="slate" size="xs" className="normal-case">
            <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />

            {job.employmentType || "Employment unavailable"}
          </Pill>

          <Pill variant="slate" size="xs" className="normal-case">
            {job.workplaceType || "Workplace unavailable"}
          </Pill>

          <Pill variant="slate" size="xs" className="normal-case">
            {job.experienceLevel || "Level unavailable"}
          </Pill>
        </div>
      </div>
      <div
        className={[
          "grid min-w-0",
          "overflow-hidden",
          "rounded-xl ",
          "sm:gap-5",

          "sm:grid-cols-3",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:block">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-4 text-slate-500">
            <UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Applications
          </p>

          <p className="text-base font-semibold leading-6 text-slate-950 sm:mt-1">
            {applicationCount}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:block">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-4 text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Last applied
          </p>

          <p className="min-w-0 wrap-break-word text-right text-sm font-medium leading-5 text-slate-700 sm:mt-1 sm:text-left">
            {formatShortDate(job.lastApplicationAt, {
              fallback: "No applications yet",
            })}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:block">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-4 text-violet-700">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Best match
          </p>

          <div className="sm:mt-1">
            <MatchScoreBadge
              match={job.bestMatch}
              size="sm"
              showLabel={false}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4 xl:border-t-0 xl:pt-0">
        <Button
          as={Link}
          to={`/company/applications/${jobId}`}
          variant="secondary"
          className="w-full shrink-0 xl:w-auto"
        >
          Review applicants
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
};

export default CompanyApplicationJobRow;
