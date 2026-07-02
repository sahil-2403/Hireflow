import { Link } from "react-router-dom";

const CandidateResumeStatusCard = ({ status, profile }) => {
  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <section className="flex min-h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-xl">
          📄
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Resume status
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {hasResume ? "Uploaded" : "Not uploaded"}
        </h2>

        {status === "loading" && (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Checking resume...
          </p>
        )}

        {status === "missing" && (
          <p className="mt-3 text-sm leading-6 text-amber-700">
            Create your candidate profile before uploading a resume.
          </p>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm leading-6 text-red-700">
            Resume status could not be loaded.
          </p>
        )}

        {status === "success" && (
          <>
            <div
              className={[
                "mt-4 rounded-xl border px-4 py-3 text-sm font-bold",
                hasResume
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {hasResume ? "Your resume is ready" : "Resume required"}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {hasResume
                ? "Use your uploaded resume while applying to relevant jobs."
                : "Upload a resume to complete your application readiness."}
            </p>
          </>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Link
          to="/candidate/resume"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          {hasResume ? "View resume" : "Upload resume"}
        </Link>
      </div>
    </section>
  );
};

export default CandidateResumeStatusCard;
