import cn from "../../utils/cn";

const VARIANT_CLASS_NAMES = {
  default: ["border-slate-200", "bg-white"].join(" "),

  flat: ["border-slate-100", "bg-white"].join(" "),

  subtle: ["border-slate-200", "bg-slate-50/60"].join(" "),

  interactive: [
    "border-slate-200",
    "bg-white",
    "transition",
    "hover:border-slate-300",
    "hover:shadow-sm",
  ].join(" "),
};

const Card = ({
  as: Component = "section",
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const resolvedVariant = VARIANT_CLASS_NAMES[variant] ? variant : "default";

  return (
    <Component
      className={cn(
        ["min-w-0", "rounded-2xl", "border"].join(" "),

        VARIANT_CLASS_NAMES[resolvedVariant],

        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

const CardHeader = ({ className = "", children, ...props }) => {
  return (
    <div
      className={cn(
        ["border-b", "border-slate-100", "p-4", "sm:p-5"].join(" "),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardBody = ({ className = "", children, ...props }) => {
  return (
    <div className={cn("p-4 sm:p-5", className)} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ className = "", children, ...props }) => {
  return (
    <div
      className={cn(
        ["border-t", "border-slate-100", "bg-slate-50/50", "p-4"].join(" "),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardBody, CardFooter };
