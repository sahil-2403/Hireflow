import { Link } from "react-router-dom";

import Button from "../ui/Button";
import { Card, CardBody, CardFooter } from "../ui/Card";

const ResumeStatusMessage = ({ status, hasResume }) => {
  if (status === "loading") {
    return (
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Checking resume...
      </p>
    );
  }

  if (status === "missing") {
    return (
      <p className="mt-3 text-sm leading-6 text-amber-700">
        Create your candidate profile before uploading a resume.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="mt-3 text-sm leading-6 text-red-700">
        Resume status could not be loaded.
      </p>
    );
  }

  return (
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
  );
};

const CandidateResumeStatusCard = ({ status, profile }) => {
  const hasResume = Boolean(profile?.resumeUrl);

  const action = (() => {
    if (status === "missing") {
      return {
        to: "/candidate/profile",
        label: "Create profile",
      };
    }

    return {
      to: "/candidate/resume",
      label: hasResume ? "View resume" : "Upload resume",
    };
  })();

  return (
    <Card className="flex min-h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-xl">
          📄
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Resume status
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {hasResume ? "Uploaded" : "Not uploaded"}
        </h2>

        <ResumeStatusMessage status={status} hasResume={hasResume} />
      </CardBody>

      <CardFooter>
        <Button as={Link} to={action.to} variant="secondary" fullWidth>
          {action.label}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateResumeStatusCard;
