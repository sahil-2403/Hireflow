import { AlertCircle, RefreshCw } from "lucide-react";

import cn from "../../utils/cn";

const SectionError = ({
  title = "Could not load this section",
  message,
  onRetry,
  compact = false,
  className = "",
}) => {
  return (
    <section
      role="alert"
      className={cn(
        [
          "rounded-2xl border",
          "border-red-200",
          "bg-red-50/70",
          compact ? "p-4" : "p-5",
        ].join(" "),
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "grid h-9 w-9 shrink-0",
            "place-items-center",
            "rounded-xl",
            "bg-red-100",
            "text-red-700",
          ].join(" ")}
        >
          <AlertCircle className="h-4.5 w-4.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-red-950">{title}</h2>

          {message && (
            <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={[
                "mt-4 inline-flex",
                "min-h-9 items-center",
                "justify-center gap-2",
                "rounded-lg",
                "border border-red-200",
                "bg-white px-3 py-2",
                "text-sm font-medium",
                "text-red-700",
                "transition",
                "hover:bg-red-100",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-red-500",
                "focus-visible:ring-offset-2",
              ].join(" ")}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SectionError;
