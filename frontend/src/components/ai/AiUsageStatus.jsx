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

const AiUsageStatus = ({ usage }) => {
  if (!usage) {
    return null;
  }

  const resetTime = formatResetTime(usage.resetAt);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="font-bold text-violet-700">
        {usage.remaining} of {usage.limit} AI uses remaining today
      </span>

      {resetTime && <span className="text-slate-500">Resets {resetTime}</span>}
    </div>
  );
};

export default AiUsageStatus;
