import cn from "../../utils/cn";

import FormField from "./FormField";

const BASE_TEXTAREA_CLASS_NAME = [
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
  "placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
].join(" ");

const TextareaInput = ({
  label,
  hint,
  error,
  id,
  rows = 5,
  className = "",
  textareaClassName = "",
  ...props
}) => {
  const textarea = (
    <textarea
      id={id}
      rows={rows}
      className={cn(
        BASE_TEXTAREA_CLASS_NAME,
        error && "border-red-300 focus:border-red-500 focus:ring-red-50",
        textareaClassName,
      )}
      {...props}
    />
  );

  if (!label && !hint && !error) {
    return textarea;
  }

  return (
    <FormField label={label} htmlFor={id} hint={hint} error={error}>
      <div className={className}>{textarea}</div>
    </FormField>
  );
};

export { BASE_TEXTAREA_CLASS_NAME };

export default TextareaInput;
