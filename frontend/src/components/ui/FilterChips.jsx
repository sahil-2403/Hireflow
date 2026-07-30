import { RotateCcw, X } from "lucide-react";

import cn from "../../utils/cn";

const FilterChips = ({
  chips = [],
  onRemove,
  onClear,
  label = "Active filters:",
  clearLabel = "Clear all",
  showDivider = true,
  className = "",
}) => {
  if (!chips.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        showDivider && "border-t border-slate-100 pt-5",
        className,
      )}
    >
      {label && (
        <span className="mr-1 text-xs font-medium leading-5 text-slate-500">
          {label}
        </span>
      )}

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove?.(chip.key)}
          aria-label={`Remove ${chip.label} filter`}
          className={[
            "inline-flex min-h-9",
            "max-w-full items-center",
            "gap-1.5 rounded-full",
            "border border-blue-100",
            "bg-blue-50",
            "px-3 py-1.5",
            "text-xs font-medium",
            "text-blue-700",
            "transition-colors",

            "hover:bg-blue-100",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-blue-500",
          ].join(" ")}
        >
          <span className="min-w-0 wrap-break-word">{chip.label}</span>

          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      ))}

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={[
            "inline-flex min-h-9",
            "items-center gap-1.5",
            "rounded-full",
            "px-3 py-1.5",
            "text-xs font-medium",
            "text-slate-600",
            "transition-colors",

            "hover:bg-slate-100",
            "hover:text-slate-900",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-blue-500",
          ].join(" ")}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />

          {clearLabel}
        </button>
      )}
    </div>
  );
};

export default FilterChips;
