import { useEffect, useState } from "react";

import { Link, NavLink, useParams } from "react-router-dom";

import { getPublicJobById } from "../../api/job.api";
import { applyToJob } from "../../api/application.api";

import { ROLES } from "../../features/auth/auth.constants";

import getApiError from "../../utils/getApiError";
import useAuth from "../../hooks/useAuth";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

const formatSalary = (job) => {
  if (!job?.isSalaryVisible) {
    return "Salary not disclosed";
  }

  if (job.salaryMin == null && job.salaryMax == null) {
    return "Salary not disclosed";
  }

  const currency = job.salaryCurrency || "INR";

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
  }

  if (job.salaryMin != null) {
    return `${currency} ${job.salaryMin}+`;
  }

  return `Up to ${currency} ${job.salaryMax}`;
};

const getCompanyInitial = (job) => {
  return (job?.companyId?.name || job?.title || "H").slice(0, 1).toUpperCase();
};

const DetailPill = ({ children }) => {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
      {children}
    </span>
  );
};

const SectionList = ({ items }) => {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
            ✓
          </span>

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const JobDetailsPage = () => {
  const { jobId } = useParams();

  const { isAuthenticated, user } = useAuth();

  const [status, setStatus] = useState("loading");

  const [job, setJob] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [coverLetter, setCoverLetter] = useState("");

  const [applyStatus, setApplyStatus] = useState("idle");

  const [applyMessage, setApplyMessage] = useState("");

  const [applyError, setApplyError] = useState("");

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

        setErrorMessage(normalizedError.message);

        setJob(null);
        setStatus("error");
      }
    };

    fetchJob();

    return () => {
      shouldIgnore = true;
    };
  }, [jobId]);

  const handleApply = async (event) => {
    event.preventDefault();

    setApplyError("");
    setApplyMessage("");

    if (coverLetter.length > 5000) {
      setApplyError("Cover letter cannot exceed 5000 characters.");
      return;
    }

    try {
      setApplyStatus("submitting");

      const result = await applyToJob(jobId, {
        coverLetter: coverLetter.trim() || null,
      });

      setApplyMessage(result.message);
      setApplyStatus("success");
    } catch (error) {
      const normalizedError = getApiError(error);

      setApplyError(normalizedError.message);

      setApplyStatus("error");
    }
  };

  const canApply = isAuthenticated && user?.role === ROLES.CANDIDATE;

  const isCompanyUser =
    user?.role === ROLES.OWNER || user?.role === ROLES.RECRUITER;

  if (status === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading job details...</p>
        </CardBody>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <main className="bg-slate-50">
        <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            icon="⚠️"
            title="Could not load job"
            description={errorMessage}
            action={
              <Button as={Link} to="/jobs">
                Back to jobs
              </Button>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="bg-slate-50">
      <NavLink to="/jobs" className="text-blue-700 text-sm font-bold ml-2">
        ← Back to jobs
      </NavLink>

      <section className="overflow-hidden rounded-3xl border mt-3 border-blue-100 bg-linear-to-br from-blue-50 via-white to-slate-50">
        <div className="mx-auto max-w-8xl px-6 py-2">
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-6">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-sm shadow-blue-200">
                {getCompanyInitial(job)}
              </div>

              <div>
                <p className="px-1 text-sm font-bold text-blue-700">
                  {job.companyId?.name || "Company unavailable"}
                </p>

                <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {job.title}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <DetailPill>
                    📍 {job.location || "Location unavailable"}
                  </DetailPill>
                  <DetailPill>🏢 {job.workplaceType}</DetailPill>
                  <DetailPill>💼 {job.employmentType}</DetailPill>
                  <DetailPill>⭐ {job.experienceLevel}</DetailPill>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Salary
              </p>

              <p className="mt-1 text-lg font-black text-slate-950">
                {formatSalary(job)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-8xl gap-6 px-0 py-8 sm:px-0 lg:grid-cols-[1fr_360px] ">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Overview
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Job description
              </h2>
            </CardHeader>

            <CardBody>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {job.description}
              </p>
            </CardBody>
          </Card>

          {job.responsibilities?.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                  Role
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Responsibilities
                </h2>
              </CardHeader>

              <CardBody>
                <SectionList items={job.responsibilities} />
              </CardBody>
            </Card>
          )}

          {job.requirements?.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                  Requirements
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  What you need
                </h2>
              </CardHeader>

              <CardBody>
                <SectionList items={job.requirements} />
              </CardBody>
            </Card>
          )}

          {job.skills?.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
                  Skills
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Skills required for this role
                </h2>
              </CardHeader>

              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="grid gap-6 self-start lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Application
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Apply for this job
              </h2>
            </CardHeader>

            <CardBody>
              {!isAuthenticated && (
                <div>
                  <p className="text-sm leading-6 text-slate-600">
                    Login as a candidate to apply for this job.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <Button as={Link} to="/login" fullWidth>
                      Login
                    </Button>

                    <Button
                      as={Link}
                      to="/register"
                      variant="secondary"
                      fullWidth
                    >
                      Register
                    </Button>
                  </div>
                </div>
              )}

              {isCompanyUser && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  Company users cannot apply to jobs. Login as a candidate to
                  apply.
                </div>
              )}

              {canApply && (
                <form onSubmit={handleApply}>
                  {applyMessage && (
                    <div
                      className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                      role="status"
                    >
                      {applyMessage}
                    </div>
                  )}

                  {applyError && (
                    <div
                      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      role="alert"
                    >
                      {applyError}
                    </div>
                  )}

                  <label
                    htmlFor="coverLetter"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Cover letter
                  </label>

                  <textarea
                    id="coverLetter"
                    rows={7}
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Optional cover letter..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    {coverLetter.length}/5000 characters
                  </p>

                  <Button
                    type="submit"
                    disabled={
                      applyStatus === "submitting" || applyStatus === "success"
                    }
                    fullWidth
                    className="mt-5"
                  >
                    {applyStatus === "submitting"
                      ? "Applying..."
                      : applyStatus === "success"
                        ? "Applied"
                        : "Apply now"}
                  </Button>

                  {applyStatus === "success" && (
                    <Button
                      as={Link}
                      to="/candidate/applications"
                      variant="secondary"
                      fullWidth
                      className="mt-3"
                    >
                      View my applications
                    </Button>
                  )}
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                Company
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                About the company
              </h2>
            </CardHeader>

            <CardBody>
              <div className="flex gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                  {getCompanyInitial(job)}
                </div>

                <div>
                  <p className="font-black text-slate-950">
                    {job.companyId?.name || "Company unavailable"}
                  </p>

                  {job.companyId?.industry && (
                    <p className="mt-1 text-sm text-slate-600">
                      {job.companyId.industry}
                    </p>
                  )}

                  {job.companyId?.headquarters && (
                    <p className="mt-1 text-sm text-slate-600">
                      {job.companyId.headquarters}
                    </p>
                  )}
                </div>
              </div>

              {job.companyId?.description && (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {job.companyId.description}
                </p>
              )}

              {job.companyId?.websiteUrl && (
                <Button
                  as="a"
                  href={job.companyId.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                  fullWidth
                  className="mt-5"
                >
                  Visit website
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Candidate tip
              </p>

              <h2 className="mt-2 text-lg font-black text-slate-950">
                Apply with a ready profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Before applying, make sure your profile and resume are updated
                so recruiters can review your application properly.
              </p>

              <div className="mt-5 grid gap-3">
                <Button
                  as={Link}
                  to="/candidate/profile"
                  variant="secondary"
                  fullWidth
                >
                  Complete profile
                </Button>

                <Button
                  as={Link}
                  to="/candidate/resume"
                  variant="secondary"
                  fullWidth
                >
                  Upload resume
                </Button>
              </div>
            </CardBody>
          </Card>
        </aside>
      </section>
    </main>
  );
};

export default JobDetailsPage;
