import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Laptop,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

import formatSalary from "../../utils/formatSalary";

import { formatRelativePostedDate } from "../../utils/formatDate";

import AiBadge from "../ai/AiBadge";

import MatchScoreBadge from "../application/MatchScoreBadge";

import CompanyLogo from "../common/CompanyLogo";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

import Pill from "../ui/Pill";

const MetadataPill = ({ icon: Icon, children }) => {
  return (
    <Pill variant="slate" size="xs" className="normal-case ring-0">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />

      {children}
    </Pill>
  );
};

const JOB_METADATA_LABELS = {
  "full-time": "Full time",
  "part-time": "Part time",
  contract: "Contract",
  internship: "Internship",
  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior level",
  lead: "Lead",
};

const getMetadataLabel = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return JOB_METADATA_LABELS[value] || value;
};

const PublicJobCard = ({ job, showMatch = false }) => {
  const jobId = job._id || job.id;

  const companyName = job.companyId?.name || "Company unavailable";

  const skills = Array.isArray(job.skills) ? job.skills : [];

  const matchedSkills = Array.isArray(job.match?.matchedSkills)
    ? job.match.matchedSkills
    : [];

  const isAiEnhanced =
    showMatch && job.match?.matchBasis === "profile_and_resume";

  const resumeBoost = Number(job.match?.resumeBoost) || 0;

  const resumeEvidence = Array.isArray(job.match?.resumeEvidence)
    ? job.match.resumeEvidence
    : [];

  return (
    <Card as="article" className="min-w-0">
      <CardBody className="p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <CompanyLogo company={job.companyId} name={companyName} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 wrap-break-word text-lg font-semibold leading-7 text-slate-950">
                {job.title}
              </h3>

              {showMatch && job.match && (
                <MatchScoreBadge match={job.match} size="sm" />
              )}

              {isAiEnhanced && <AiBadge>AI-enhanced</AiBadge>}
            </div>

            <p className="mt-1 wrap-break-word text-sm font-medium leading-5 text-slate-700">
              {companyName}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <MetadataPill icon={MapPin}>
                {job.location || "Location unavailable"}
              </MetadataPill>

              <MetadataPill icon={BriefcaseBusiness}>
                {getMetadataLabel(
                  job.employmentType,
                  "Employment unavailable",
                )}{" "}
              </MetadataPill>

              <MetadataPill icon={Laptop}>
                {getMetadataLabel(
                  job.workplaceType,
                  "Workplace unavailable",
                )}{" "}
              </MetadataPill>

              <MetadataPill icon={GraduationCap}>
                {getMetadataLabel(
                  job.experienceLevel,
                  "Level unavailable",
                )}{" "}
              </MetadataPill>
            </div>

            <p className="mt-4 text-sm font-semibold leading-5 text-slate-900">
              {formatSalary(job)}
            </p>

            {skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.slice(0, 5).map((skill) => (
                  <Pill key={skill} variant="blue" size="xs">
                    {skill}
                  </Pill>
                ))}

                {skills.length > 5 && (
                  <Pill size="xs">+{skills.length - 5}</Pill>
                )}
              </div>
            )}

            {showMatch && matchedSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium leading-5 text-slate-500">
                  Matched skills
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {matchedSkills.slice(0, 4).map((skill) => (
                    <Pill key={skill} variant="emerald" size="xs">
                      {skill}
                    </Pill>
                  ))}

                  {matchedSkills.length > 4 && (
                    <Pill size="xs">+{matchedSkills.length - 4}</Pill>
                  )}
                </div>
              </div>
            )}

            {isAiEnhanced && (
              <details
                className={[
                  "group mt-4",
                  "rounded-xl border",
                  "border-violet-100",
                  "bg-violet-50/60",
                  "open:bg-violet-50/80",
                ].join(" ")}
              >
                <summary
                  className={[
                    "flex min-h-11",
                    "cursor-pointer",
                    "list-none",
                    "items-center",
                    "justify-between",
                    "gap-3 px-3 py-2",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-violet-500",

                    "[&::-webkit-details-marker]:hidden",
                  ].join(" ")}
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-xs font-medium leading-5 text-violet-700">
                    <Sparkles
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Resume Insights applied
                  </span>

                  {resumeBoost > 0 && (
                    <Pill variant="violet" size="xs" className="shrink-0">
                      +{resumeBoost} match{" "}
                      {resumeBoost === 1 ? "point" : "points"}
                    </Pill>
                  )}
                </summary>

                <div className="border-t border-violet-100 px-3 py-3">
                  <p className="text-xs leading-5 text-slate-700">
                    {resumeEvidence[0] ||
                      "Stored resume skills and target roles were considered when calculating this match."}
                  </p>

                  {resumeEvidence.length > 1 && (
                    <p className="mt-1 text-xs font-medium leading-5 text-violet-600">
                      +{resumeEvidence.length - 1} more resume-based{" "}
                      {resumeEvidence.length - 1 === 1 ? "signal" : "signals"}
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
            <p className="text-xs leading-5 text-slate-500">
              {formatRelativePostedDate(job.createdAt)}
            </p>

            <Button
              as={Link}
              to={`/jobs/${jobId}`}
              variant="secondary"
              size="sm"
            >
              View details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PublicJobCard;
