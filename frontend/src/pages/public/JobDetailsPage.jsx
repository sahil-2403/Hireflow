import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Laptop,
  LoaderCircle,
  LogIn,
  MapPin,
  Search,
  Send,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { applyToJob } from "../../api/application.api";
import { getPublicJobById } from "../../api/job.api";
import { getRecommendedJobMatch } from "../../api/recommendation.api";

import CandidateJobResumeFitCard from "../../components/ai/CandidateJobResumeFitCard";

import CompanyLogo from "../../components/common/CompanyLogo";

import CandidateJobMatchCard from "../../components/jobs/CandidateJobMatchCard";

import PublicJobDetailsSkeleton from "../../components/loading/PublicJobDetailsSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import { Card, CardBody } from "../../components/ui/Card";

import Pill from "../../components/ui/Pill";
import SectionError from "../../components/ui/SectionError";
import TextareaInput from "../../components/ui/TextareaInput";

import { ROLES } from "../../features/auth/auth.constants";

import useAuth from "../../hooks/useAuth";

import { formatRelativePostedDate } from "../../utils/formatDate";

import getApiError from "../../utils/getApiError";
import formatSalary from "../../utils/formatSalary";
import notify from "../../utils/notify";

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

const JobMetadataPill = ({ icon: Icon, children }) => {
  return (
    <Pill variant="slate" size="sm" className="normal-case ring-0">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />

      {children}
    </Pill>
  );
};

const SectionList = ({ items }) => {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>

          <span className="min-w-0 wrap-break-word text-sm leading-6 text-slate-700">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
};

const ContentSection = ({
  title,
  description,
  children,
  showBorder = true,
}) => {
  return (
    <section className={showBorder ? "border-t border-slate-100 pt-6" : ""}>
      <h2 className="text-lg font-semibold leading-7 text-slate-950">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      )}

      <div className="mt-4">{children}</div>
    </section>
  );
};

const JobApplicationCard = ({
  isAuthenticated,
  canApply,
  isCompanyUser,
  coverLetter,
  applyStatus,
  applyError,
  onCoverLetterChange,
  onSubmit,
}) => {
  const coverLetterLength = coverLetter.length;

  const isCoverLetterTooLong = coverLetterLength > 5000;

  return (
    <Card id="job-application" className="scroll-mt-24">
      <CardBody className="p-4 sm:p-5">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Send className="h-5 w-5" aria-hidden="true" />
          </div>

          <h2 className="text-lg font-semibold leading-7 text-slate-950">
            Apply for this job
          </h2>
        </header>

        {!isAuthenticated && (
          <div className="mt-5">
            <p className="text-sm leading-6 text-slate-600">
              Sign in as a candidate to apply and view your profile-based job
              match.
            </p>

            <div className="mt-5 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-1">
              <Button as={Link} to="/login" fullWidth>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Button>

              <Button as={Link} to="/register" variant="secondary" fullWidth>
                Create candidate account
              </Button>
            </div>
          </div>
        )}

        {isCompanyUser && (
          <div className="mt-5">
            <Alert variant="warning">
              Company accounts cannot apply to jobs. Candidate accounts can
              submit applications.
            </Alert>

            <Button
              as={Link}
              to="/jobs"
              variant="secondary"
              fullWidth
              className="mt-4"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse other jobs
            </Button>
          </div>
        )}

        {canApply && applyStatus === "success" && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <h3 className="text-sm font-semibold text-emerald-950">
                  Application submitted
                </h3>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  You can follow its progress from your candidate workspace.
                </p>
              </div>
            </div>

            <Button
              as={Link}
              to="/candidate/applications"
              variant="secondary"
              fullWidth
              className="mt-4"
            >
              View my applications
            </Button>
          </div>
        )}

        {canApply && applyStatus !== "success" && (
          <form onSubmit={onSubmit} className="mt-5" noValidate>
            {applyError && (
              <Alert variant="error" className="mb-4">
                {applyError}
              </Alert>
            )}

            <TextareaInput
              id="coverLetter"
              label="Cover letter"
              hint="Optional. Add a short role-specific introduction."
              rows={6}
              value={coverLetter}
              onChange={onCoverLetterChange}
              placeholder="Explain briefly why you are interested in this role..."
              error={
                isCoverLetterTooLong
                  ? "Cover letter cannot exceed 5000 characters."
                  : ""
              }
            />

            <p
              className={[
                "mt-1 text-right",
                "text-xs leading-5",

                isCoverLetterTooLong ? "text-red-600" : "text-slate-500",
              ].join(" ")}
            >
              {coverLetterLength}/5000
            </p>

            <Button
              type="submit"
              disabled={applyStatus === "submitting" || isCoverLetterTooLong}
              fullWidth
              className="mt-5"
            >
              {applyStatus === "submitting" ? (
                <>
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Apply now
                </>
              )}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
};

const CompanyInformationCard = ({ company }) => {
  const companyName = company?.name || "Company unavailable";

  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>

          <h2 className="text-lg font-semibold leading-7 text-slate-950">
            Company profile
          </h2>
        </header>

        <div className="mt-5 flex min-w-0 items-start gap-3">
          <CompanyLogo company={company} name={companyName} size="md" />

          <div className="min-w-0">
            <h3 className="wrap-break-word text-base font-semibold leading-6 text-slate-950">
              {companyName}
            </h3>

            {company?.industry && (
              <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-500">
                {company.industry}
              </p>
            )}
          </div>
        </div>

        {company?.headquarters && (
          <p className="mt-4 inline-flex items-start gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />

            <span className="wrap-break-word">{company.headquarters}</span>
          </p>
        )}

        {company?.description && (
          <p className="mt-4 whitespace-pre-line wrap-break-word text-sm leading-6 text-slate-600">
            {company.description}
          </p>
        )}

        {company?.websiteUrl && (
          <Button
            as="a"
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            fullWidth
            className="mt-5"
          >
            Visit website
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

const JobDetailsPage = () => {
  const { jobId } = useParams();

  const { isAuthenticated, user } = useAuth();

  const [status, setStatus] = useState("loading");

  const [job, setJob] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [jobLoadAttempt, setJobLoadAttempt] = useState(0);

  const [matchAttempt, setMatchAttempt] = useState(0);

  const [matchState, setMatchState] = useState({
    status: "idle",
    data: null,
    errorMessage: "",
  });

  const [coverLetter, setCoverLetter] = useState("");

  const [applyStatus, setApplyStatus] = useState("idle");

  const [applyError, setApplyError] = useState("");

  const canApply = isAuthenticated && user?.role === ROLES.CANDIDATE;

  const isCompanyUser =
    user?.role === ROLES.OWNER || user?.role === ROLES.RECRUITER;

  useEffect(() => {
    let shouldIgnore = false;

    const fetchJob = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const result = await getPublicJobById(jobId);

        if (shouldIgnore) {
          return;
        }

        setJob(result.data);
        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setJob(null);
        setErrorMessage(normalizedError.message);
        setStatus("error");
      }
    };

    fetchJob();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, jobLoadAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchMatch = async () => {
      if (!canApply) {
        setMatchState({
          status: "idle",
          data: null,
          errorMessage: "",
        });

        return;
      }

      try {
        setMatchState({
          status: "loading",
          data: null,
          errorMessage: "",
        });

        const result = await getRecommendedJobMatch(jobId);

        if (shouldIgnore) {
          return;
        }

        setMatchState({
          status: "success",
          data: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setMatchState({
          status: "error",
          data: null,
          errorMessage: normalizedError.message,
        });
      }
    };

    fetchMatch();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId, canApply, matchAttempt]);

  const handleApply = async (event) => {
    event.preventDefault();

    setApplyError("");

    if (coverLetter.length > 5000) {
      setApplyError("Cover letter cannot exceed 5000 characters.");

      return;
    }

    try {
      setApplyStatus("submitting");

      const result = await applyToJob(jobId, {
        coverLetter: coverLetter.trim() || null,
      });

      setApplyStatus("success");

      notify.success(result.message || "Application submitted successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setApplyError(normalizedError.message);
      setApplyStatus("error");
    }
  };

  if (status === "loading") {
    return <PublicJobDetailsSkeleton />;
  }

  if (status === "error" || !job) {
    return (
      <div className="mx-auto grid max-w-375 gap-5">
        <Button as={Link} to="/jobs" variant="ghost" className="w-fit">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Button>

        <SectionError
          title="Could not load job"
          message={errorMessage}
          onRetry={() =>
            setJobLoadAttempt((currentAttempt) => currentAttempt + 1)
          }
        />
      </div>
    );
  }

  const companyName = job.companyId?.name || "Company unavailable";

  return (
    <div className="mx-auto grid max-w-375 gap-5">
      <Button as={Link} to="/jobs" variant="ghost" className="w-fit">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </Button>

      <section className="border-b border-slate-200 pb-5 sm:pb-6">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4 min-[420px]:flex-row">
            <CompanyLogo
              company={job.companyId}
              name={companyName}
              size="xl"
              fallbackClassName="bg-blue-600 text-white"
            />

            <div className="min-w-0">
              <p className="wrap-break-word text-sm font-medium leading-6 text-blue-700">
                {companyName}
              </p>

              <h1 className="mt-1 max-w-4xl wrap-break-word text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <JobMetadataPill icon={MapPin}>
                  {job.location || "Location unavailable"}
                </JobMetadataPill>

                <JobMetadataPill icon={Laptop}>
                  {getMetadataLabel(job.workplaceType, "Workplace unavailable")}
                </JobMetadataPill>

                <JobMetadataPill icon={BriefcaseBusiness}>
                  {getMetadataLabel(
                    job.employmentType,
                    "Employment unavailable",
                  )}
                </JobMetadataPill>

                <JobMetadataPill icon={GraduationCap}>
                  {getMetadataLabel(job.experienceLevel, "Level unavailable")}
                </JobMetadataPill>
              </div>

              {job.createdAt && (
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Posted {formatRelativePostedDate(job.createdAt)}
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 lg:max-w-xs lg:text-right">
            <p className="text-xs font-medium leading-5 text-slate-500">
              Salary
            </p>

            <p className="mt-1 wrap-break-word text-lg font-semibold leading-7 text-slate-950">
              {formatSalary(job)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0">
          <Card>
            <CardBody className="grid gap-6 p-5 sm:p-6">
              <ContentSection title="Job description" showBorder={false}>
                <p className="whitespace-pre-line wrap-break-word text-sm leading-7 text-slate-700">
                  {job.description || "No job description was provided."}
                </p>
              </ContentSection>

              {job.responsibilities?.length > 0 && (
                <ContentSection
                  title="Responsibilities"
                  description="What you will be expected to handle in this role."
                >
                  <SectionList items={job.responsibilities} />
                </ContentSection>
              )}

              {job.requirements?.length > 0 && (
                <ContentSection
                  title="Requirements"
                  description="Experience and qualifications the company is looking for."
                >
                  <SectionList items={job.requirements} />
                </ContentSection>
              )}

              {job.skills?.length > 0 && (
                <ContentSection
                  title="Skills for this role"
                  description="Technologies and abilities associated with the position."
                >
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Pill key={skill} variant="blue" size="sm">
                        {skill}
                      </Pill>
                    ))}
                  </div>
                </ContentSection>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="grid min-w-0 gap-5">
          <JobApplicationCard
            isAuthenticated={isAuthenticated}
            canApply={canApply}
            isCompanyUser={isCompanyUser}
            coverLetter={coverLetter}
            applyStatus={applyStatus}
            applyError={applyError}
            onCoverLetterChange={(event) => setCoverLetter(event.target.value)}
            onSubmit={handleApply}
          />

          <CompanyInformationCard company={job.companyId} />
        </aside>
      </section>

      {canApply && (
        <section
          className="grid min-w-0 gap-5"
          aria-label="Candidate job insights"
        >
          <CandidateJobMatchCard
            status={matchState.status}
            matchData={matchState.data}
            errorMessage={matchState.errorMessage}
            onRetry={() =>
              setMatchAttempt((currentAttempt) => currentAttempt + 1)
            }
          />

          <CandidateJobResumeFitCard
            jobId={jobId}
            availabilityStatus={matchState.status}
            availability={matchState.data?.aiResumeFit || null}
            availabilityError={matchState.errorMessage}
          />
        </section>
      )}
    </div>
  );
};

export default JobDetailsPage;
