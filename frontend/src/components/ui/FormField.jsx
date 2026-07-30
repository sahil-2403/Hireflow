import cn from "../../utils/cn";

const FormField = ({
  label,
  htmlFor,
  hint,
  hintId,
  error,
  errorId,
  required = false,
  className = "",
  children,
}) => {
  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={[
            "mb-1.5 block",
            "text-sm font-medium",
            "leading-5 text-slate-700",
          ].join(" ")}
        >
          {label}

          {required && (
            <span aria-hidden="true" className="ml-1 text-red-600">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs leading-4.5 text-slate-500">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium leading-4.5 text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
