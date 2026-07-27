import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ClipboardList,
  ExternalLink as ExternalLinkIcon,
  FileText,
  Lightbulb,
  LoaderCircle,
  Target,
  UserRound,
  Workflow,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import {
  getManagedJobApplicationDetails,
  updateManagedApplicationStatus,
  viewManagedApplicationResume,
} from "../../api/application.api";

import CompanyApplicationInterviewKitCard from "../../components/ai/CompanyApplicationInterviewKitCard";
import CompanyApplicationResumeReviewCard from "../../components/ai/CompanyApplicationResumeReviewCard";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";
import MatchBreakdownCard from "../../components/application/MatchBreakdownCard";
import SkillMatchList from "../../components/application/SkillMatchList";

import ProfileAvatar from "../../components/common/ProfileAvatar";

import JobStatusBadge from "../../components/company/JobStatusBadge";

import CompanyApplicationDetailsPageSkeleton from "../../components/loading/CompanyApplicationDetailsPageSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import SectionError from "../../components/ui/SectionError";
import SelectInput from "../../components/ui/SelectInput";

import { getApplicationStatusLabel } from "../../features/applications/application.constants";

import { formatDateTime } from "../../utils/formatDate";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";
import openPdfBlob from "../../utils/openPdfBlob";

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const getChangedByLabel = (changedBy) => {
  if (!changedBy) {
    return "System";
  }

  if (typeof changedBy === "string") {
    return "User";
  }

  return changedBy.username || changedBy.email || "User";
};

const DetailItem = ({ label, value }) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>

      <p className="mt-0.5 wrap-break-word text-sm font-medium leading-6 text-slate-800">
        {value || "Not available"}
      </p>
    </div>
  );
};

const InformationCardHeader = ({ icon: Icon, title, description }) => {
  return (
    <header className="flex min-w-0 items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-6 text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </header>
  );
};

const ExternalProfileLink = ({ href, icon: Icon, children }) => {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={[
        "inline-flex min-h-9",
        "items-center gap-1.5",
        "rounded-lg border",
        "border-blue-100",
        "bg-blue-50",
        "px-3 py-1.5",
        "text-xs font-medium",
        "text-blue-700",
        "transition-colors",

        "hover:bg-blue-100",

        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-blue-500",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />

      {children}
    </a>
  );
};

const MinimalCandidateHeader = ({
  candidate,
  candidateUser,
  candidateName,
  job,
  jobId,
  openingResume,
  onViewResume,
}) => {
  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ProfileAvatar
              user={candidateUser}
              name={candidateName}
              size="lg"
              fallbackClassName="bg-blue-50 text-blue-700"
            />

            <div className="min-w-0">
              <h1 className="wrap-break-word text-xl font-semibold leading-7 tracking-tight text-slate-950 sm:text-2xl sm:leading-8">
                {candidateName}
              </h1>

              {candidate?.headline && (
                <p className="mt-1 wrap-break-word text-sm font-medium leading-6 text-slate-700">
                  {candidate.headline}
                </p>
              )}

              <p className="mt-2 inline-flex min-w-0 items-start gap-1.5 text-xs leading-5 text-slate-500">
                <BriefcaseBusiness
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />

                <span className="wrap-break-word">
                  {job?.title || "Job unavailable"}
                </span>
              </p>
            </div>
          </div>

          <div
            className={[
              "grid gap-2",
              "sm:flex sm:justify-end",

              candidate?.resumeUrl ? "grid-cols-2" : "grid-cols-1",
            ].join(" ")}
          >
            {candidate?.resumeUrl && (
              <Button
                type="button"
                variant="secondary"
                disabled={openingResume}
                onClick={onViewResume}
              >
                {openingResume ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin "
                    aria-hidden="true"
                  />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden="true" />
                )}

                {openingResume ? "Opening" : "View resume"}
              </Button>
            )}
            <Button as={Link} to={`/jobs/${jobId}`}>
              View job
              <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateProfileCard = ({ candidate, candidateUser }) => {
  return (
    <Card className="order-2 xl:col-span-6">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={UserRound}
          title="Candidate profile"
          description="Profile information submitted by the candidate."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Email" value={candidateUser?.email} />

          <DetailItem label="Location" value={candidate?.location} />

          <DetailItem label="Experience" value={candidate?.experienceLevel} />

          <DetailItem
            label="Resume"
            value={candidate?.resumeUrl ? "Available" : "Not added"}
          />
        </div>

        {candidate?.summary && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium leading-5 text-slate-500">
              Professional summary
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {candidate.summary}
            </p>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <SkillMatchList
            title="Skills"
            skills={candidate?.skills || []}
            emptyMessage="No candidate skills listed."
            variant="neutral"
          />
        </div>

        <div className="flex flex-col mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium">Other links</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ExternalProfileLink
              href={candidate?.linkedinUrl}
              icon={ExternalLinkIcon}
            >
              LinkedIn
            </ExternalProfileLink>

            <ExternalProfileLink
              href={candidate?.githubUrl}
              icon={ExternalLinkIcon}
            >
              GitHub
            </ExternalProfileLink>

            <ExternalProfileLink
              href={candidate?.portfolioUrl}
              icon={ExternalLinkIcon}
            >
              Portfolio
            </ExternalProfileLink>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const JobBeingReviewedCard = ({ job, jobId }) => {
  return (
    <Card className="order-3 xl:col-span-6">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={BriefcaseBusiness}
          title="Job being reviewed"
          description="The role connected to this application."
        />

        <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 wrap-break-word text-sm font-semibold leading-6 text-slate-950">
            {job?.title || "Job unavailable"}
          </h3>

          <JobStatusBadge status={job?.status} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Location" value={job?.location} />

          <DetailItem label="Employment" value={job?.employmentType} />

          <DetailItem label="Workplace" value={job?.workplaceType} />

          <DetailItem label="Experience" value={job?.experienceLevel} />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <SkillMatchList
            title="Required skills"
            skills={job?.skills || []}
            emptyMessage="No required skills listed."
            variant="neutral"
          />
        </div>

        <div className="mt-5">
          <Button as={Link} to={`/jobs/${jobId}`} variant="secondary" size="sm">
            View full job posting
            <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

const ApplicationStageCard = ({
  application,
  allowedNextStatuses,
  selectedNextStatus,
  updatingStatus,
  onNextStatusChange,
  onUpdateStatus,
}) => {
  const statusOptions = allowedNextStatuses.map((status) => ({
    value: status,

    label: getApplicationStatusLabel(status),
  }));

  const statusHistory = application?.statusHistory || [];

  return (
    <Card className="order-1 xl:col-span-12">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={Workflow}
          title="Application stage"
          description="Manage progress through the hiring workflow."
        />

        <div
          className={[
            "mt-5 grid min-w-0",
            "gap-5",

            "xl:grid-cols-[150px_minmax(0,1fr)_220px]",
            "xl:items-stretch",
          ].join(" ")}
        >
          {/* Current status */}
          <section className="min-w-0 xl:border-r xl:border-slate-200 xl:pr-5">
            <p className="text-xs font-medium leading-5 text-slate-500">
              Current status
            </p>

            <div className="mt-2">
              <ApplicationStatusBadge status={application?.status} />
            </div>
          </section>

          {/* Horizontal status history */}
          <section className="min-w-0">
            <h3 className="text-xs font-medium leading-5 text-slate-600">
              Status history
            </h3>

            {statusHistory.length > 0 ? (
              <div className="mt-4 flex min-w-0 flex-col flex-wrap sm:flex-row gap-y-5">
                {statusHistory.map((historyItem, index) => {
                  const isLastItem = index === statusHistory.length - 1;

                  return (
                    <article
                      key={`${historyItem.status}-${historyItem.changedAt || historyItem.createdAt || index}`}
                      className="relative min-w-28 flex-1 pr-3"
                    >
                      <div className="flex min-w-0 items-center">
                        <span
                          className={[
                            "relative z-10",
                            "h-2.5 w-2.5",
                            "shrink-0",
                            "rounded-full",
                            "bg-blue-500",
                            "ring-4",
                            "ring-blue-50",
                          ].join(" ")}
                        />

                        {!isLastItem && (
                          <span className="h-px min-w-8 flex-1 bg-slate-200" />
                        )}
                      </div>

                      <div className="mt-2 min-w-0 pr-3">
                        <ApplicationStatusBadge status={historyItem.status} />

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {formatDateTime(
                            historyItem.changedAt || historyItem.createdAt,
                          )}
                        </p>

                        <p className="text-[11px] leading-4 text-slate-400">
                          by {getChangedByLabel(historyItem.changedBy)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                No status history is available.
              </p>
            )}
          </section>

          {/* Compact status controls */}
          <section className="border-t border-slate-200 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            {allowedNextStatuses.length > 0 ? (
              <div className="grid gap-2">
                <SelectInput
                  id="application-next-stage"
                  label="Next stage"
                  value={selectedNextStatus}
                  options={statusOptions}
                  placeholder="Select next stage"
                  disabled={Boolean(updatingStatus)}
                  selectClassName="min-h-10 rounded-lg px-3 py-2 text-sm"
                  onChange={(event) => onNextStatusChange(event.target.value)}
                />

                <Button
                  type="button"
                  size="sm"
                  fullWidth
                  disabled={!selectedNextStatus || Boolean(updatingStatus)}
                  onClick={onUpdateStatus}
                >
                  {updatingStatus ? (
                    <>
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Updating
                    </>
                  ) : (
                    "Update status"
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium leading-5 text-slate-500">
                  Next stage
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  No further stage changes are available.
                </p>
              </div>
            )}
          </section>
        </div>
      </CardBody>
    </Card>
  );
};

const getMatchScore = (match) => {
  const score = Number(match?.matchScore);

  return Number.isFinite(score) ? Math.round(score) : null;
};

const getMatchTone = (score) => {
  if (score === null) {
    return ["border-slate-200", "bg-slate-50", "text-slate-600"].join(" ");
  }

  if (score >= 70) {
    return ["border-emerald-200", "bg-emerald-50", "text-emerald-700"].join(
      " ",
    );
  }

  if (score >= 50) {
    return ["border-amber-200", "bg-amber-50", "text-amber-700"].join(" ");
  }

  return ["border-red-200", "bg-red-50", "text-red-700"].join(" ");
};

const MatchSummaryBadge = ({ match }) => {
  const score = getMatchScore(match);

  return (
    <span
      className={[
        "inline-flex min-h-9",
        "items-center",
        "rounded-lg border",
        "px-3 py-1.5",
        "text-sm font-semibold",

        getMatchTone(score),
      ].join(" ")}
    >
      {score === null
        ? "Match unavailable"
        : `${score}% · ${match?.matchLabel || "Match"}`}
    </span>
  );
};

const ApplicationMatchCard = ({ match }) => {
  return (
    <Card className="order-4 xl:col-span-6">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={Target}
          title="Application match"
          description="Deterministic comparison against the current job."
        />

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium leading-5 text-slate-500">
              Overall match
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Confidence:{" "}
              <span className="font-medium text-slate-800">
                {match?.confidenceLevel || "Not available"}
              </span>
            </p>
          </div>

          <MatchSummaryBadge match={match} />
        </div>

        <div className="mt-5">
          <MatchBreakdownCard breakdown={match?.breakdown} />
        </div>
      </CardBody>
    </Card>
  );
};

const MatchInformationList = ({
  title,
  items,
  emptyMessage,
  variant = "neutral",
}) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  const markerClassName =
    variant === "warning" ? "text-amber-600" : "text-blue-600";

  return (
    <section className="min-w-0">
      <h3 className="text-xs font-medium leading-5 text-slate-600">{title}</h3>

      {normalizedItems.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {normalizedItems.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex gap-2 text-sm leading-6 text-slate-700"
            >
              <span aria-hidden="true" className={markerClassName}>
                •
              </span>

              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
};

const MatchInsightsCard = ({ match }) => {
  return (
    <Card className="order-5 xl:col-span-6">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={Lightbulb}
          title="Match insights"
          description="Skills and evidence that explain the deterministic score."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <SkillMatchList
            title="Matched skills"
            skills={match?.matchedSkills || []}
            emptyMessage="No matched skills."
            variant="matched"
          />

          <SkillMatchList
            title="Missing skills"
            skills={match?.missingSkills || []}
            emptyMessage="No missing skills."
            variant="missing"
          />

          <SkillMatchList
            title="Extra candidate skills"
            skills={match?.extraCandidateSkills || []}
            emptyMessage="No extra candidate skills."
            variant="extra"
          />
        </div>

        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-2">
          <MatchInformationList
            title="Match reasons"
            items={match?.reasons}
            emptyMessage="No match reasons are available."
          />

          <MatchInformationList
            title="Confidence notes"
            items={match?.warnings}
            emptyMessage="No confidence warnings were returned."
            variant="warning"
          />
        </div>
      </CardBody>
    </Card>
  );
};

const ApplicationSubmissionCard = ({ application }) => {
  return (
    <Card className="order-6 xl:col-span-12">
      <CardBody className="p-4 sm:p-5">
        <InformationCardHeader
          icon={ClipboardList}
          title="Application submission"
          description="Submission timing, review ownership and cover letter."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Applied on"
            value={formatDateTime(application?.appliedAt)}
          />

          <DetailItem
            label="Reviewed by"
            value={
              application?.reviewedBy?.username ||
              application?.reviewedBy?.email
            }
          />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium leading-5 text-slate-500">
            Cover letter
          </p>

          {application?.coverLetter ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {application.coverLetter}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              No cover letter submitted.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const CompanyApplicationDetailsPage = () => {
  const { jobId, applicationId } = useParams();

  const [requestStatus, setRequestStatus] = useState("loading");

  const [details, setDetails] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [updatingStatus, setUpdatingStatus] = useState("");

  const [selectedNextStatus, setSelectedNextStatus] = useState("");

  const [openingResume, setOpeningResume] = useState(false);

  const [activeAiPanel, setActiveAiPanel] = useState(null);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchDetails = async () => {
      try {
        setRequestStatus("loading");

        setErrorMessage("");

        const result = await getManagedJobApplicationDetails(
          jobId,
          applicationId,
        );

        if (shouldIgnore) {
          return;
        }

        const nextStatuses = result.data?.allowedNextStatuses ?? [];

        setDetails(result.data);

        setSelectedNextStatus(nextStatuses[0] || "");

        setActiveAiPanel(null);

        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setRequestStatus("error");
      }
    };

    fetchDetails();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, applicationId, refreshKey]);

  const application = details?.application;

  const candidate = details?.candidate;

  const candidateUser = details?.candidateUser;

  const job = details?.job;
  const match = details?.match;

  const allowedNextStatuses = details?.allowedNextStatuses ?? [];

  const candidateName = details ? getCandidateName(candidate) : "Candidate";

  const handleStatusUpdate = async () => {
    if (!selectedNextStatus || updatingStatus) {
      return;
    }

    const confirmed = window.confirm(
      `Move this application from ${getApplicationStatusLabel(
        application?.status,
      )} to ${getApplicationStatusLabel(selectedNextStatus)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStatus(selectedNextStatus);

      const result = await updateManagedApplicationStatus(
        applicationId,
        selectedNextStatus,
      );

      notify.success(result.message || "Application status updated.");

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not update application status", {
        description: normalizedError.message,
      });
    } finally {
      setUpdatingStatus("");
    }
  };

  const handleViewResume = async () => {
    try {
      setOpeningResume(true);

      const resumeBlob = await viewManagedApplicationResume(applicationId);

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not open resume", {
        description: normalizedError.message,
      });
    } finally {
      setOpeningResume(false);
    }
  };

  const isInitialLoading = requestStatus === "loading" && !details;

  if (isInitialLoading) {
    return <CompanyApplicationDetailsPageSkeleton />;
  }

  if (requestStatus === "error" && !details) {
    return (
      <div className="grid gap-5">
        <Button
          as={Link}
          to={`/company/applications/${jobId}`}
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to applicants
        </Button>

        <SectionError
          title="Could not load application details"
          message={errorMessage}
          onRetry={() => setRefreshKey((currentValue) => currentValue + 1)}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Button
        as={Link}
        to={`/company/applications/${jobId}`}
        variant="ghost"
        size="sm"
        className="w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to applicants
      </Button>

      {requestStatus === "error" && details && (
        <SectionError
          compact
          title="Could not refresh application details"
          message={errorMessage}
          onRetry={() => setRefreshKey((currentValue) => currentValue + 1)}
        />
      )}

      <MinimalCandidateHeader
        candidate={candidate}
        candidateUser={candidateUser}
        candidateName={candidateName}
        job={job}
        jobId={jobId}
        openingResume={openingResume}
        onViewResume={handleViewResume}
      />

      <section className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-stretch">
        <CompanyApplicationResumeReviewCard
          key={`resume-review-${applicationId}`}
          applicationId={applicationId}
          availability={details?.aiResumeReview}
          isResultVisible={activeAiPanel === "resume-review"}
          resultsContainerId="company-application-ai-results"
          onResultVisibilityChange={(isVisible) =>
            setActiveAiPanel(isVisible ? "resume-review" : null)
          }
        />

        <CompanyApplicationInterviewKitCard
          key={`interview-kit-${applicationId}`}
          applicationId={applicationId}
          availability={details?.aiInterviewKit}
          isResultVisible={activeAiPanel === "interview-kit"}
          resultsContainerId="company-application-ai-results"
          onResultVisibilityChange={(isVisible) =>
            setActiveAiPanel(isVisible ? "interview-kit" : null)
          }
        />
      </section>

      <div
        id="company-application-ai-results"
        aria-live="polite"
        className={activeAiPanel ? "min-w-0" : "hidden"}
      />

      {!activeAiPanel && (
        <section className="grid min-w-0 gap-5 sm:items-stretch xl:grid-cols-12 ">
          <ApplicationStageCard
            application={application}
            allowedNextStatuses={allowedNextStatuses}
            selectedNextStatus={selectedNextStatus}
            updatingStatus={updatingStatus}
            onNextStatusChange={setSelectedNextStatus}
            onUpdateStatus={handleStatusUpdate}
          />

          <CandidateProfileCard
            candidate={candidate}
            candidateUser={candidateUser}
          />

          <JobBeingReviewedCard job={job} jobId={jobId} />

          <ApplicationMatchCard match={match} />

          <MatchInsightsCard match={match} />

          <ApplicationSubmissionCard application={application} />
        </section>
      )}
    </div>
  );
};

export default CompanyApplicationDetailsPage;
