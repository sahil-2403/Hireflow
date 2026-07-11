import cn from "../../utils/cn";

const VARIANT_CLASS_NAMES = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const ROLE_BY_VARIANT = {
  error: "alert",
  success: "status",
  warning: "alert",
  info: "status",
  neutral: "status",
};

const Alert = ({
  variant = "error",
  title,
  children,
  className = "",
  role,
}) => {
  const resolvedVariant = VARIANT_CLASS_NAMES[variant] ? variant : "neutral";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-6",
        VARIANT_CLASS_NAMES[resolvedVariant],
        className,
      )}
      role={role || ROLE_BY_VARIANT[resolvedVariant]}
    >
      {title && <p className="font-bold">{title}</p>}

      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
};

export default Alert;
