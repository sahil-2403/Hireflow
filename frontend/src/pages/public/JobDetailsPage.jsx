import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { getPublicJobById } from "../../api/job.api";

import { applyToJob } from "../../api/application.api";

import { ROLES } from "../../features/auth/auth.constants";

import getApiError from "../../utils/getApiError";
import useAuth from "../../hooks/useAuth";

const formatSalary = (job) => {
  if (!job?.isSalaryVisible) {
    return "Salary not disclosed";
  }

  if (job.salaryMin === null && job.salaryMax === null) {
    return "Salary not disclosed";
  }

  const currency = job.salaryCurrency || "INR";

  if (job.salaryMin !== null && job.salaryMax !== null) {
    return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
  }

  if (job.salaryMin !== null) {
    return `${currency} ${job.salaryMin}+`;
  }

  return `Up to ${currency} ${job.salaryMax}`;
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-600">Loading job details...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700">Could not load job</h1>

          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>

          <Link
            to="/jobs"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/jobs"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to jobs
          </Link>

          <p className="mt-6 text-sm font-medium text-slate-500">
            {job.companyId?.name || "Company unavailable"}
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">
            {job.title}
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {job.location} ·{" "}
            <span className="capitalize">{job.workplaceType}</span> ·{" "}
            <span className="capitalize">{job.employmentType}</span> ·{" "}
            <span className="capitalize">{job.experienceLevel}</span>
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-800">
            {formatSalary(job)}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="grid gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Job description
            </h2>

            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
              {job.description}
            </p>
          </section>

          {job.responsibilities?.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Responsibilities
              </h2>

              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {job.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements?.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Requirements</h2>

              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {job.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {job.skills?.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Skills</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="grid gap-6 self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Apply for this job
            </h2>

            {!isAuthenticated && (
              <div className="mt-4">
                <p className="text-sm leading-6 text-slate-600">
                  Login as a candidate to apply for this job.
                </p>

                <div className="mt-5 flex gap-3">
                  <Link
                    to="/login"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {isCompanyUser && (
              <p className="mt-4 text-sm leading-6 text-amber-700">
                Company users cannot apply to jobs. Login as a candidate to
                apply.
              </p>
            )}

            {canApply && (
              <form onSubmit={handleApply} className="mt-5">
                {applyMessage && (
                  <div
                    className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    role="status"
                  >
                    {applyMessage}
                  </div>
                )}

                {applyError && (
                  <div
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {applyError}
                  </div>
                )}

                <label
                  htmlFor="coverLetter"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Cover letter
                </label>

                <textarea
                  id="coverLetter"
                  rows={7}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="Optional cover letter..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  {coverLetter.length}/5000 characters
                </p>

                <button
                  type="submit"
                  disabled={
                    applyStatus === "submitting" || applyStatus === "success"
                  }
                  className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {applyStatus === "submitting"
                    ? "Applying..."
                    : applyStatus === "success"
                      ? "Applied"
                      : "Apply now"}
                </button>

                {applyStatus === "success" && (
                  <Link
                    to="/candidate/applications"
                    className="mt-3 inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View my applications
                  </Link>
                )}
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Company</h2>

            <p className="mt-3 font-semibold text-slate-900">
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

            {job.companyId?.websiteUrl && (
              <a
                href={job.companyId.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Visit website
              </a>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
};

export default JobDetailsPage;
