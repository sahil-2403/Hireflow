import { Link } from "react-router-dom";

const CandidateResumeStatusCard = ({ status, profile }) => {
  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
        Resume
      </p>

      <h2 className="text-xl font-bold text-slate-950">Resume status</h2>

      {status === "loading" && (
        <p className="mt-4 text-sm text-slate-600">Checking resume...</p>
      )}

      {status === "missing" && (
        <p className="mt-4 text-sm leading-6 text-amber-700">
          Create your candidate profile before uploading a resume.
        </p>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm leading-6 text-red-700">
          Resume status could not be loaded.
        </p>
      )}

      {status === "success" && (
        <>
          <div
            className={[
              "mt-4 rounded-lg border px-4 py-3 text-sm font-medium",
              hasResume
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {hasResume ? "Resume uploaded" : "Resume not uploaded"}
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {hasResume
              ? "Your resume is ready for job applications."
              : "You need to upload a resume before applying to jobs."}
          </p>

          {hasResume && (
            <Link
              to="/candidate/resume"
              className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View resume
            </Link>
          )}
        </>
      )}
    </section>
  );
};

export default CandidateResumeStatusCard;
