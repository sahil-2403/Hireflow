const formatResetTime = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const AiUsageStatus = ({ usage, className = "" }) => {
  if (!usage) {
    return null;
  }

  const resetTime = formatResetTime(usage.resetAt);

  return (
    <div
      className={[
        "flex min-w-0",
        "flex-wrap items-center",
        "gap-x-2 gap-y-1",
        "text-xs leading-5",
        className,
      ].join(" ")}
    >
      <span className="font-medium text-violet-700">
        {usage.remaining} of {usage.limit} AI uses remaining today
      </span>

      {resetTime && (
        <>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>

          <span className="text-slate-500">Resets {resetTime}</span>
        </>
      )}
    </div>
  );
};

export default AiUsageStatus;
