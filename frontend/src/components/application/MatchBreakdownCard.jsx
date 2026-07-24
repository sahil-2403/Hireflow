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

      return "Role-title alignment";
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

      return "Location fit";
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

const formatNumber = (number) => {
  if (!Number.isFinite(number)) {
    return "0";
  }

  if (Number.isInteger(number)) {
    return String(number);
  }

  return Number(number.toFixed(2)).toString();
};

const formatScore = (item) => {
  if (
    !item ||
    typeof item.score !== "number" ||
    typeof item.maxScore !== "number"
  ) {
    return "Not available";
  }

  return `${formatNumber(item.score)}/${formatNumber(item.maxScore)}`;
};

const getScorePercentage = (item) => {
  if (
    !item ||
    typeof item.score !== "number" ||
    typeof item.maxScore !== "number" ||
    item.maxScore <= 0
  ) {
    return 0;
  }

  return Math.min(Math.max((item.score / item.maxScore) * 100, 0), 100);
};

const getBarClassName = (percentage) => {
  if (percentage >= 70) {
    return "bg-emerald-500";
  }

  if (percentage >= 40) {
    return "bg-amber-500";
  }

  return "bg-red-500";
};

const MatchBreakdownCard = ({ breakdown }) => {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200">
      <header className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="text-xs font-medium leading-5 text-slate-500">
          Score by category
        </p>
      </header>

      <div className="divide-y divide-slate-100">
        {BREAKDOWN_ITEMS.map((item) => {
          const value = breakdown?.[item.key];

          const percentage = getScorePercentage(value);

          return (
            <div
              key={item.key}
              className="grid gap-2 px-4 py-3 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
            >
              <p className="text-xs font-medium leading-5 text-slate-800">
                {item.label}
              </p>

              <div className="min-w-0">
                <p className="truncate text-[11px] leading-4 text-slate-500">
                  {item.helper(value)}
                </p>

                <div
                  role="progressbar"
                  aria-label={`${item.label} score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percentage)}
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className={[
                      "h-full rounded-full",
                      "transition-[width]",
                      getBarClassName(percentage),
                    ].join(" ")}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>

              <span className="w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                {formatScore(value)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MatchBreakdownCard;
