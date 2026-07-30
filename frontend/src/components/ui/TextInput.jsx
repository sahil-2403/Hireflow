import cn from "../../utils/cn";

import FormField from "./FormField";

const BASE_INPUT_CLASS_NAME = [
  "block min-h-11 w-full",
  "min-w-0 rounded-xl",
  "border border-slate-200",
  "bg-white px-3 py-2.5",

  /*
   * 16px mobile text prevents unwanted
   * browser zoom when focusing fields.
   */
  "text-base leading-6",
  "text-slate-900",
  "sm:text-sm",

  "outline-none transition",

  "placeholder:text-slate-400",

  "focus:border-blue-500",
  "focus:ring-2",
  "focus:ring-blue-100",

  "disabled:cursor-not-allowed",
  "disabled:bg-slate-50",
  "disabled:text-slate-500",
].join(" ");

const TextInput = ({
  label,
  hint,
  error,
  required = false,
  id,
  className = "",
  inputClassName = "",
  type = "text",
  "aria-describedby": ariaDescribedBy,
  ...props
}) => {
  const hintId = hint && id ? `${id}-hint` : undefined;

  const errorId = error && id ? `${id}-error` : undefined;

  const describedBy = [ariaDescribedBy, error ? errorId : hintId]
    .filter(Boolean)
    .join(" ");

  const input = (
    <input
      id={id}
      type={type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      className={cn(
        BASE_INPUT_CLASS_NAME,

        error &&
          ["border-red-300", "focus:border-red-500", "focus:ring-red-100"].join(
            " ",
          ),

        inputClassName,
      )}
      {...props}
    />
  );

  if (!label && !hint && !error) {
    return input;
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
      {input}
    </FormField>
  );
};

export { BASE_INPUT_CLASS_NAME };

export default TextInput;
