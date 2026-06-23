const getStatusClassName = (status) => {
  const baseClassName =
    "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize";

  const statusClassNames = {
    applied: "bg-slate-100 text-slate-700",
    screening: "bg-blue-50 text-blue-700",
    interview: "bg-purple-50 text-purple-700",
    offer: "bg-amber-50 text-amber-700",
    hired: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  return [
    baseClassName,
    statusClassNames[status] || "bg-slate-100 text-slate-700",
  ].join(" ");
};

const ApplicationStatusBadge = ({ status }) => {
  return (
    <span className={getStatusClassName(status)}>{status || "unknown"}</span>
  );
};

export default ApplicationStatusBadge;
