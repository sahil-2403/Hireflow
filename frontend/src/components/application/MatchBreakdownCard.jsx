import { Card, CardBody, CardHeader } from "../ui/Card";

const BREAKDOWN_ITEMS = [
  {
    key: "skills",
    label: "Skills",
    helper: (item) => {
      if (
        typeof item?.matchedSkillCount === "number" &&
        typeof item?.requiredSkillCount === "number"
      ) {
        return `${item.matchedSkillCount}/${item.requiredSkillCount} required skills matched`;
      }

      return "Skill overlap";
    },
  },
  {
    key: "title",
    label: "Title fit",
    helper: (item) => {
      if (typeof item?.similarityPercentage === "number") {
        return `${item.similarityPercentage}% title similarity`;
      }

      return item?.source ? `Source: ${item.source}` : "Role alignment";
    },
  },
  {
    key: "experience",
    label: "Experience",
    helper: (item) => {
      if (item?.candidateExperienceLevel || item?.jobExperienceLevel) {
        return `${item?.candidateExperienceLevel || "candidate"} → ${
          item?.jobExperienceLevel || "job"
        }`;
      }

      return "Experience fit";
    },
  },
  {
    key: "location",
    label: "Location",
    helper: (item) => {
      if (item?.matchedLocation) {
        return `Matched: ${item.matchedLocation}`;
      }

      return item?.source ? `Source: ${item.source}` : "Location fit";
    },
  },
  {
    key: "workplaceType",
    label: "Workplace",
    helper: (item) => {
      if (typeof item?.matched === "boolean") {
        return item.matched ? "Preference matched" : "Preference not matched";
      }

      return "Workplace preference";
    },
  },
  {
    key: "employmentType",
    label: "Employment",
    helper: (item) => {
      if (typeof item?.matched === "boolean") {
        return item.matched ? "Preference matched" : "Preference not matched";
      }

      return "Employment preference";
    },
  },
];

const formatScore = (item) => {
  if (
    !item ||
    typeof item.score !== "number" ||
    typeof item.maxScore !== "number"
  ) {
    return "Not available";
  }

  return `${item.score}/${item.maxScore}`;
};

const MatchBreakdownCard = ({ breakdown }) => {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Match breakdown
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          Score by category
        </h2>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3">
          {BREAKDOWN_ITEMS.map((item) => {
            const value = breakdown?.[item.key];

            return (
              <div
                key={item.key}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.helper(value)}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                  {formatScore(value)}
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default MatchBreakdownCard;
