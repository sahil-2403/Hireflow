import { Link } from "react-router-dom";

const CandidateApplicationsSummaryCard = ({
  status,
  applicationsData,
  errorMessage,
}) => {
  const applications = applicationsData?.applications ?? [];

  const pagination = applicationsData?.pagination ?? null;

  const totalApplications = pagination?.total ?? applications.length;

  const latestApplication = applications[0];

  return (
    <section className="flex min-h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-xl">
          📬
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Applications
        </p>

        <h2 className="mt-2 text-4xl font-black text-slate-950">
          {status === "success" ? totalApplications : "—"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Total applications submitted from your candidate account.
        </p>

        {status === "loading" && (
          <p className="mt-4 text-sm text-slate-600">Loading applications...</p>
        )}

        {status === "error" && (
          <p className="mt-4 text-sm text-red-700">{errorMessage}</p>
        )}

        {status === "success" && latestApplication && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Latest application
            </p>

            <p className="mt-1 font-bold text-slate-950">
              {latestApplication.jobId?.title || "Job title unavailable"}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {latestApplication.companyId?.name || "Company unavailable"}
            </p>
          </div>
        )}

        {status === "success" && !latestApplication && (
          <p className="mt-5 text-sm leading-6 text-slate-600">
            You have not applied to any jobs yet.
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        <Link
          to="/candidate/applications"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          View applications
        </Link>
      </div>
    </section>
  );
};

export default CandidateApplicationsSummaryCard;
