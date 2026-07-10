const getScoreTone = (score) => {
  if (typeof score !== "number") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  if (score >= 85) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (score >= 70) {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (score >= 55) {
    return "bg-violet-50 text-violet-700 ring-violet-100";
  }

  if (score >= 40) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-red-50 text-red-700 ring-red-100";
};

const sizeClassNames = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-xs",
  lg: "px-4 py-2 text-sm",
};

const MatchScoreBadge = ({ match, size = "md", showLabel = true }) => {
  if (!match || typeof match.matchScore !== "number") {
    return (
      <span
        className={[
          "inline-flex w-fit items-center rounded-full font-bold ring-1",
          sizeClassNames[size] || sizeClassNames.md,
          "bg-slate-100 text-slate-600 ring-slate-200",
        ].join(" ")}
      >
        No match data
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5 rounded-full font-bold ring-1",
        sizeClassNames[size] || sizeClassNames.md,
        getScoreTone(match.matchScore),
      ].join(" ")}
    >
      <span>{match.matchScore}%</span>

      {showLabel && match.matchLabel && (
        <span className="hidden sm:inline">· {match.matchLabel}</span>
      )}
    </span>
  );
};

export default MatchScoreBadge;
