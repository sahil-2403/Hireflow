const variantClasses = {
  primary:
    "bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-70",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-70",
  ghost: "text-slate-700 hover:bg-slate-100 disabled:opacity-70",
  danger:
    "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-70",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

const Button = ({
  as: Component = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <Component
      className={[
        "inline-flex items-center justify-center rounded-xl font-bold transition disabled:cursor-not-allowed",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
