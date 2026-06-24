const JobStatusBadge = ({ status }) => {
  const className =
    status === "open"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
};

export default JobStatusBadge;
