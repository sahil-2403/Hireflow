import { Link } from "react-router-dom";

import Button from "../ui/Button";
import { Card, CardBody, CardFooter } from "../ui/Card";
import ProfileAvatar from "../common/ProfileAvatar";

const getProfileCompletion = (profile) => {
  if (!profile) {
    return {
      completed: 0,
      total: 6,
      percentage: 0,
    };
  }

  const checks = [
    Boolean(profile.firstName),
    Boolean(profile.lastName),
    Boolean(profile.experienceLevel),
    Boolean(profile.location),
    Boolean(profile.headline),
    Array.isArray(profile.skills) && profile.skills.length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
};

const ProfileProgressCircle = ({ percentage }) => {
  return (
    <div
      className="grid h-16 w-16 place-items-center rounded-full text-sm font-black text-blue-700"
      style={{
        background: `conic-gradient(#2563eb ${
          percentage * 3.6
        }deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-white">
        {percentage}%
      </div>
    </div>
  );
};

const CandidateProfileSummaryCard = ({
  status,
  profile,
  errorMessage,
  user,
}) => {
  if (status === "loading") {
    return (
      <Card className="flex min-h-full flex-col">
        <CardBody>
          <p className="text-sm text-slate-600">Loading candidate profile...</p>
        </CardBody>
      </Card>
    );
  }

  if (status === "missing") {
    return (
      <Card className="flex min-h-full flex-col border-amber-200 bg-amber-50">
        <CardBody className="flex flex-1 flex-col">
          <ProfileAvatar
            user={user}
            size="md"
            fallbackClassName="mb-4 bg-amber-100 text-amber-700"
          />

          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            Profile incomplete
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            Create your profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            You need a candidate profile before applying to jobs.
          </p>
        </CardBody>

        <CardFooter className="border-amber-200/70 bg-amber-100/40">
          <Button as={Link} to="/candidate/profile" fullWidth>
            Create profile
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="min-h-full border-red-200 bg-red-50">
        <CardBody>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-700">
            Profile error
          </p>

          <p className="text-sm text-red-700">{errorMessage}</p>
        </CardBody>
      </Card>
    );
  }

  const completion = getProfileCompletion(profile);

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  return (
    <Card className="flex min-h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <ProfileAvatar
            user={user}
            name={fullName}
            size="md"
            fallbackClassName="bg-blue-50 text-blue-700"
          />

          <ProfileProgressCircle percentage={completion.percentage} />
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Profile status
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          {completion.percentage === 100 ? "Complete" : "In progress"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {fullName}
          {profile.headline ? ` · ${profile.headline}` : ""}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{
              width: `${completion.percentage}%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs font-medium text-slate-500">
          {completion.completed} of {completion.total} sections completed
        </p>
      </CardBody>

      <CardFooter>
        <Button as={Link} to="/candidate/profile" variant="secondary" fullWidth>
          Edit profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateProfileSummaryCard;
