import cn from "../../utils/cn";

import FormField from "./FormField";

const BASE_SELECT_CLASS_NAME = [
  "block min-h-11 w-full",
  "min-w-0 rounded-xl",
  "border border-slate-200",
  "bg-white px-3 py-2.5",

  "text-base font-normal",
  "leading-6 text-slate-800",
  "sm:text-sm",

  "outline-none transition",

  "focus:border-blue-500",
  "focus:ring-2",
  "focus:ring-blue-100",

  "disabled:cursor-not-allowed",
  "disabled:bg-slate-50",
  "disabled:text-slate-500",
].join(" ");

const SelectInput = ({
  label,
  hint,
  error,
  required = false,
  id,
  options = [],
  placeholder,
  className = "",
  selectClassName = "",
  children,
  "aria-describedby": ariaDescribedBy,
  ...props
}) => {
  const hintId = hint && id ? `${id}-hint` : undefined;

  const errorId = error && id ? `${id}-error` : undefined;

  const describedBy = [ariaDescribedBy, error ? errorId : hintId]
    .filter(Boolean)
    .join(" ");

  const select = (
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      className={cn(
        BASE_SELECT_CLASS_NAME,

        error &&
          ["border-red-300", "focus:border-red-500", "focus:ring-red-100"].join(
            " ",
          ),

        selectClassName,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}

      {children ||
        options.map((option) => (
          <option
            key={option.value || option.label}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
    </select>
  );

  if (!label && !hint && !error) {
    return select;
  }

  return (
    <FormField
      label={label}
      htmlFor={id}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
      required={required}
      className={className}
    >
      {select}
    </FormField>
  );
};

export { BASE_SELECT_CLASS_NAME };

export default SelectInput;
