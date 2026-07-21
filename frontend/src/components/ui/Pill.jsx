import cn from "../../utils/cn";

const VARIANT_CLASS_NAMES = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",

  blue: "bg-blue-50 text-blue-700 ring-blue-100",

  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",

  green: "bg-green-50 text-green-700 ring-green-100",

  violet: "bg-violet-50 text-violet-700 ring-violet-100",

  purple: "bg-purple-50 text-purple-700 ring-purple-100",

  amber: "bg-amber-50 text-amber-700 ring-amber-100",

  red: "bg-red-50 text-red-700 ring-red-100",
};

const SIZE_CLASS_NAMES = {
  xs: "px-2 py-0.5 text-[11px] leading-4",

  sm: "px-2.5 py-1 text-xs leading-4",

  md: "px-2.5 py-1 text-xs leading-4",

  lg: "px-3 py-1.5 text-sm leading-5",
};

const Pill = ({
  as: Component = "span",
  children,
  variant = "slate",
  size = "md",
  rounded = "full",
  className = "",
  title,
  ...props
}) => {
  const resolvedVariant = VARIANT_CLASS_NAMES[variant] ? variant : "slate";

  const resolvedSize = SIZE_CLASS_NAMES[size] ? size : "md";

  return (
    <Component
      title={title}
      className={cn(
        [
          "inline-flex max-w-full",
          "w-fit items-center",
          "gap-1 font-medium",
          "ring-1",
        ].join(" "),

        rounded === "xl" ? "rounded-xl" : "rounded-full",

        VARIANT_CLASS_NAMES[resolvedVariant],

        SIZE_CLASS_NAMES[resolvedSize],

        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Pill;
