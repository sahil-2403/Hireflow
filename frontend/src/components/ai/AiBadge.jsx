import { Sparkles } from "lucide-react";

import cn from "../../utils/cn";

const AiBadge = ({ children = "AI powered", className = "" }) => {
  return (
    <span
      className={cn(
        [
          "inline-flex w-fit",
          "max-w-full",
          "items-center gap-1.5",
          "rounded-full",
          "border",
          "border-violet-100",
          "bg-violet-50",
          "px-2.5 py-1",
          "text-xs font-medium",
          "leading-4",
          "text-violet-700",
        ].join(" "),
        className,
      )}
    >
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />

      <span className="min-w-0">{children}</span>
    </span>
  );
};

export default AiBadge;
