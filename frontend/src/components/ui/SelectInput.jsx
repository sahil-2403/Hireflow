import cn from "../../utils/cn";

import FormField from "./FormField";

const BASE_SELECT_CLASS_NAME = [
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition",
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
].join(" ");

const SelectInput = ({
  label,
  hint,
  error,
  id,
  options = [],
  placeholder,
  className = "",
  selectClassName = "",
  children,
  ...props
}) => {
  const select = (
    <select
      id={id}
      className={cn(
        BASE_SELECT_CLASS_NAME,
        error && "border-red-300 focus:border-red-500 focus:ring-red-50",
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
    <FormField label={label} htmlFor={id} hint={hint} error={error}>
      <div className={className}>{select}</div>
    </FormField>
  );
};

export { BASE_SELECT_CLASS_NAME };

export default SelectInput;
