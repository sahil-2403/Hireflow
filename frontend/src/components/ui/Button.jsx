import cn from "../../utils/cn";

import { forwardRef } from "react";

const VARIANT_CLASS_NAMES = {
  primary: [
    "bg-blue-600",
    "text-white",
    "hover:bg-blue-700",
    "active:bg-blue-800",
  ].join(" "),

  secondary: [
    "border border-slate-200",
    "bg-white",
    "text-slate-700",
    "hover:border-slate-300",
    "hover:bg-slate-50",
    "active:bg-slate-100",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-slate-700",
    "hover:bg-slate-100",
    "active:bg-slate-200/70",
  ].join(" "),

  danger: [
    "border border-red-200",
    "bg-red-50",
    "text-red-700",
    "hover:border-red-300",
    "hover:bg-red-100",
    "active:bg-red-200/60",
  ].join(" "),

  ai: [
    "bg-violet-600",
    "text-white",
    "hover:bg-violet-700",
    "active:bg-violet-800",
  ].join(" "),
};

const SIZE_CLASS_NAMES = {
  /*
   * Small actions retain a 44px mobile
   * touch target and become visually
   * compact on larger screens.
   */
  xs: ["min-h-11", "px-2.5 py-2", "text-xs", "sm:min-h-8", "sm:py-1.5"].join(
    " ",
  ),

  sm: ["min-h-11", "px-3 py-2", "text-sm", "sm:min-h-9"].join(" "),

  md: ["min-h-11", "px-4 py-2.5", "text-sm"].join(" "),

  lg: ["min-h-11", "px-5 py-2.5", "text-sm", "sm:min-h-12"].join(" "),
};

const Button = forwardRef(
  (
    {
      as: Component = "button",
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedVariant = VARIANT_CLASS_NAMES[variant] ? variant : "primary";

    const resolvedSize = SIZE_CLASS_NAMES[size] ? size : "md";

    return (
      <Component
        ref={ref}
        className={cn(
          [
            "inline-flex min-w-0",
            "items-center justify-center",
            "gap-2 rounded-lg",
            "font-medium leading-5",
            "transition-colors",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-blue-500",
            "focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed",
            "disabled:opacity-60",
          ].join(" "),

          VARIANT_CLASS_NAMES[resolvedVariant],

          SIZE_CLASS_NAMES[resolvedSize],

          fullWidth && "w-full",

          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Button.displayName = "Button";

export default Button;
