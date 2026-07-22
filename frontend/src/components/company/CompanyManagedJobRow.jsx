import {
  BriefcaseBusiness,
  CalendarDays,
  Edit3,
  Eye,
  LoaderCircle,
  MapPin,
  Power,
  PowerOff,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { formatShortDate } from "../../utils/formatDate";

import JobStatusBadge from "./JobStatusBadge";

import Button from "../ui/Button";
import Pill from "../ui/Pill";

const CompanyManagedJobRow = ({ job, isUpdating, onToggleStatus }) => {
  const jobId = job._id || job.id;

  const isOpen = job.status === "open";

  const creatorName = job.createdBy?.username || job.createdBy?.email || null;

  return (
    <article className="grid min-w-0 gap-5 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.65fr)_auto] xl:items-center">
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

        {creatorName && (
          <p className="mt-3 inline-flex min-w-0 items-start gap-1.5 text-xs leading-5 text-slate-500">
            <UserRound
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />

            <span className="wrap-break-word">Created by {creatorName}</span>
          </p>
        )}
      </div>

      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium leading-5 text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Created
        </p>

        <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
          {formatShortDate(job.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:flex sm:flex-wrap xl:max-w-96 xl:justify-end xl:border-t-0 xl:pt-0">
        <Button
          as={Link}
          to={`/company/applications/${jobId}`}
          variant="secondary"
          size="sm"
          className="col-span-2 sm:col-auto"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Applications
        </Button>

        <Button
          as={Link}
          to={`/company/jobs/${jobId}/edit`}
          variant="secondary"
          size="sm"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>

        <Button
          type="button"
          size="sm"
          variant={isOpen ? "danger" : "secondary"}
          disabled={isUpdating}
          onClick={() => onToggleStatus(job)}
          className={
            !isOpen
              ? [
                  "border-emerald-200",
                  "bg-emerald-50",
                  "text-emerald-700",
                  "hover:bg-emerald-100",
                ].join(" ")
              : ""
          }
        >
          {isUpdating ? (
            <>
              <LoaderCircle
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Updating
            </>
          ) : isOpen ? (
            <>
              <PowerOff className="h-4 w-4" aria-hidden="true" />
              Close
            </>
          ) : (
            <>
              <Power className="h-4 w-4" aria-hidden="true" />
              Open
            </>
          )}
        </Button>
      </div>
    </article>
  );
};

export default CompanyManagedJobRow;
