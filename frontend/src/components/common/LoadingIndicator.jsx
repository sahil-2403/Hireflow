import cn from "../../utils/cn";

const LoadingIndicator = ({ label = "Loading HireFlow", className = "" }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("grid place-items-center", className)}
    >
      <span
        aria-hidden="true"
        className={[
          "h-5 w-5",
          "animate-spin rounded-full",
          "border-2 border-slate-200",
          "border-t-blue-600",
        ].join(" ")}
      />
    </div>
  );
};

export default LoadingIndicator;
