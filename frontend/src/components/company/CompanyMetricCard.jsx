import cn from "../../utils/cn";

import { Card, CardBody } from "../ui/Card";

const TONE_CLASS_NAMES = {
  blue: {
    icon: "bg-blue-50 text-blue-700",
    value: "text-slate-950",
  },

  emerald: {
    icon: "bg-emerald-50 text-emerald-700",
    value: "text-slate-950",
  },

  violet: {
    icon: "bg-violet-50 text-violet-700",
    value: "text-slate-950",
  },

  amber: {
    icon: "bg-amber-50 text-amber-700",
    value: "text-slate-950",
  },

  red: {
    icon: "bg-red-50 text-red-700",
    value: "text-slate-950",
  },

  slate: {
    icon: "bg-slate-100 text-slate-600",
    value: "text-slate-950",
  },
};

const CompanyMetricCard = ({
  label,
  value,
  helperText,
  icon: Icon,
  tone = "blue",
  compact = false,
}) => {
  const toneClasses = TONE_CLASS_NAMES[tone] || TONE_CLASS_NAMES.blue;

  return (
    <Card variant="flat">
      <CardBody>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">
              {label}
            </p>

            <p
              className={cn(
                [
                  "mt-2 font-semibold",
                  "tracking-tight",
                  toneClasses.value,
                ].join(" "),

                compact
                  ? ["text-xl", "leading-7", "sm:text-2xl"].join(" ")
                  : ["text-2xl", "leading-8", "sm:text-3xl"].join(" "),
              )}
            >
              {value ?? 0}
            </p>
          </div>

          {Icon && (
            <div
              className={cn(
                [
                  "grid shrink-0",
                  "place-items-center",
                  "rounded-xl",
                  toneClasses.icon,
                ].join(" "),

                compact ? "h-9 w-9" : "h-10 w-10",
              )}
            >
              <Icon
                className={compact ? "h-4 w-4" : "h-5 w-5"}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {helperText && !compact && (
          <p className="mt-2 text-xs leading-5 text-slate-500">{helperText}</p>
        )}
      </CardBody>
    </Card>
  );
};

export default CompanyMetricCard;
