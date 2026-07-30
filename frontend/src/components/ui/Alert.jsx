import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import cn from "../../utils/cn";

const VARIANT_CONFIGURATION = {
  error: {
    classes: "border-red-200 bg-red-50/70 text-red-800",

    iconClasses: "bg-red-100 text-red-700",

    icon: AlertCircle,

    role: "alert",
  },

  success: {
    classes: "border-emerald-200 bg-emerald-50/70 text-emerald-800",

    iconClasses: "bg-emerald-100 text-emerald-700",

    icon: CheckCircle2,

    role: "status",
  },

  warning: {
    classes: "border-amber-200 bg-amber-50/70 text-amber-900",

    iconClasses: "bg-amber-100 text-amber-700",

    icon: TriangleAlert,

    role: "alert",
  },

  info: {
    classes: "border-blue-200 bg-blue-50/70 text-blue-800",

    iconClasses: "bg-blue-100 text-blue-700",

    icon: Info,

    role: "status",
  },

  neutral: {
    classes: "border-slate-200 bg-slate-50 text-slate-700",

    iconClasses: "bg-slate-200 text-slate-600",

    icon: Info,

    role: "status",
  },
};

const Alert = ({
  variant = "error",
  title,
  children,
  className = "",
  role,
  showIcon = true,
  icon,
}) => {
  const resolvedVariant = VARIANT_CONFIGURATION[variant] ? variant : "neutral";

  const configuration = VARIANT_CONFIGURATION[resolvedVariant];

  const AlertIcon = icon || configuration.icon;

  return (
    <div
      role={role || configuration.role}
      className={cn(
        ["rounded-xl border", "px-4 py-3", "text-sm leading-6"].join(" "),

        configuration.classes,

        className,
      )}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div
            className={cn(
              [
                "mt-0.5 grid",
                "h-7 w-7",
                "shrink-0",
                "place-items-center",
                "rounded-lg",
              ].join(" "),

              configuration.iconClasses,
            )}
          >
            <AlertIcon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}

          {children && <div className={cn(title && "mt-1")}>{children}</div>}
        </div>
      </div>
    </div>
  );
};

export default Alert;
