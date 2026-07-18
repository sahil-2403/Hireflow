import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
  getManagedJobApplicationDetails,
  updateManagedApplicationStatus,
  viewManagedApplicationResume,
} from "../../api/application.api";

import getApiError from "../../utils/getApiError";
import openPdfBlob from "../../utils/openPdfBlob";
import { formatDateTime } from "../../utils/formatDate";

import ApplicationStatusBadge from "../../components/application/ApplicationStatusBadge";
import MatchBreakdownCard from "../../components/application/MatchBreakdownCard";
import MatchScoreBadge from "../../components/application/MatchScoreBadge";
import SkillMatchList from "../../components/application/SkillMatchList";
import JobStatusBadge from "../../components/company/JobStatusBadge";
import ProfileAvatar from "../../components/common/ProfileAvatar";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import PageHero from "../../components/ui/PageHero";
import Alert from "../../components/ui/Alert";

import CompanyApplicationResumeReviewCard from "../../components/ai/CompanyApplicationResumeReviewCard";

import { getApplicationStatusLabel } from "../../features/applications/application.constants";

const getCandidateName = (candidate) => {
  const name = [candidate?.firstName, candidate?.lastName]
    .filter(Boolean)
    .join(" ");

  return name || "Candidate unavailable";
};

const DetailItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value || "Not available"}
      </p>
    </div>
  );
};

const ExternalLink = ({ href, children }) => {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
    >
      {children}
    </a>
  );
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

const CompanyApplicationDetailsPage = () => {
  const { jobId, applicationId } = useParams();

  const [requestStatus, setRequestStatus] = useState("loading");

  const [details, setDetails] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [updatingStatus, setUpdatingStatus] = useState("");

  const [openingResume, setOpeningResume] = useState(false);

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

        setDetails(result.data);
        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);
        setDetails(null);
        setRequestStatus("error");
      }
    };

    fetchDetails();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, applicationId, refreshKey]);

  const handleStatusUpdate = async (nextStatus) => {
    const currentStatus = details?.application?.status;

    const confirmed = window.confirm(
      `Move this application from ${getApplicationStatusLabel(
        currentStatus,
      )} to ${getApplicationStatusLabel(nextStatus)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStatus(nextStatus);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await updateManagedApplicationStatus(
        applicationId,
        nextStatus,
      );

      setSuccessMessage(result.message);
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setUpdatingStatus("");
    }
  };

  const handleViewResume = async () => {
    try {
      setErrorMessage("");
      setOpeningResume(true);

      const resumeBlob = await viewManagedApplicationResume(applicationId);

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
    } finally {
      setOpeningResume(false);
    }
  };

  const application = details?.application;
  const candidate = details?.candidate;
  const candidateUser = details?.candidateUser;
  const job = details?.job;
  const match = details?.match;
  const allowedNextStatuses = details?.allowedNextStatuses ?? [];
  const candidateName = details ? getCandidateName(candidate) : "Candidate";

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Application details"
        title={candidateName || "Detailed application"}
        description={
          job?.title
            ? `Detailed review for ${job.title}.`
            : "Detailed application review and status tracking."
        }
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              as={Link}
              to={`/company/applications/${jobId}`}
              variant="secondary"
            >
              Back to applicants
            </Button>

            {candidate?.resumeUrl && (
              <Button
                type="button"
                variant="secondary"
                disabled={openingResume}
                onClick={handleViewResume}
              >
                {openingResume ? "Opening resume..." : "View resume"}
              </Button>
            )}
          </div>
        }
      />

      {requestStatus === "loading" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-600">
              Loading application details...
            </p>
          </CardBody>
        </Card>
      )}

      {requestStatus === "error" && (
        <Alert variant="error" title="Could not load application details">
          {errorMessage}
        </Alert>
      )}

      {requestStatus === "success" && details && (
        <>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <Card>
            <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <ProfileAvatar
                  user={candidateUser}
                  name={candidateName}
                  size="lg"
                  fallbackClassName="bg-blue-50 text-blue-700"
                />

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-950">
                      {candidateName}
                    </h2>

                    <ApplicationStatusBadge status={application?.status} />
                  </div>

                  {candidate?.headline && (
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {candidate.headline}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-slate-500">
                    Applied {formatDateTime(application?.appliedAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Match score
                </p>

                <MatchScoreBadge match={match} size="lg" />

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Confidence:{" "}
                  <span className="text-slate-800">
                    {match?.confidenceLevel || "Not available"}
                  </span>
                </p>
              </div>
            </CardBody>
          </Card>

          <CompanyApplicationResumeReviewCard
            applicationId={applicationId}
            availability={details.aiResumeReview}
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Candidate
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Candidate details
                </h2>
              </CardHeader>

              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Email" value={candidateUser?.email} />

                  <DetailItem label="Location" value={candidate?.location} />

                  <DetailItem
                    label="Experience"
                    value={candidate?.experienceLevel}
                  />

                  <DetailItem
                    label="Resume"
                    value={candidate?.resumeUrl ? "Available" : "Not added"}
                  />
                </div>

                {candidate?.summary && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Summary
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {candidate.summary}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <SkillMatchList
                    title="Candidate skills"
                    skills={candidate?.skills || []}
                    emptyMessage="No skills listed."
                    variant="neutral"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <ExternalLink href={candidate?.linkedinUrl}>
                    LinkedIn
                  </ExternalLink>
                  <ExternalLink href={candidate?.githubUrl}>
                    GitHub
                  </ExternalLink>
                  <ExternalLink href={candidate?.portfolioUrl}>
                    Portfolio
                  </ExternalLink>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Job
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Job details
                </h2>
              </CardHeader>

              <CardBody>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-black text-slate-950">
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

                <div className="mt-5">
                  <SkillMatchList
                    title="Required skills"
                    skills={job?.skills || []}
                    emptyMessage="No job skills listed."
                    variant="neutral"
                  />
                </div>

                {job?.description && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {job.description}
                    </p>
                  </div>
                )}

                {job?.requirements && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Requirements
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {Array.isArray(job.requirements)
                        ? job.requirements.join("\n")
                        : job.requirements}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Match overview
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Match details
                </h2>
              </CardHeader>

              <CardBody>
                <div className="grid gap-4">
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
                    emptyMessage="No extra skills."
                    variant="extra"
                  />
                </div>

                {match?.reasons?.length > 0 && (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Reasons
                    </p>

                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                      {match.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {match?.warnings?.length > 0 && (
                  <div className="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                      Confidence notes
                    </p>

                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-800">
                      {match.warnings.map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>

            <MatchBreakdownCard breakdown={match?.breakdown} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Application
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Application details
                </h2>
              </CardHeader>

              <CardBody>
                <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cover letter
                  </p>

                  {application?.coverLetter ? (
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {application.coverLetter}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No cover letter submitted.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Status
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Status tracking
                </h2>
              </CardHeader>

              <CardBody>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    Current status:{" "}
                    <span className="font-bold text-slate-950">
                      {getApplicationStatusLabel(application?.status)}
                    </span>
                  </p>

                  {allowedNextStatuses.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {allowedNextStatuses.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={status === "rejected" ? "danger" : "primary"}
                          disabled={Boolean(updatingStatus)}
                          onClick={() => handleStatusUpdate(status)}
                        >
                          {updatingStatus === status
                            ? "Updating..."
                            : getApplicationStatusLabel(status)}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No further status changes available.
                    </p>
                  )}
                </div>

                <div className="mt-5 grid gap-3">
                  {application?.statusHistory?.length > 0 ? (
                    application.statusHistory.map((historyItem, index) => (
                      <div
                        key={`${historyItem.status}-${index}`}
                        className="rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <ApplicationStatusBadge status={historyItem.status} />

                          <span className="text-xs text-slate-500">
                            by {getChangedByLabel(historyItem.changedBy)}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          {formatDateTime(
                            historyItem.changedAt || historyItem.createdAt,
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No status history available.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyApplicationDetailsPage;
