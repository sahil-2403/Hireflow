import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import cn from "../../utils/cn";

import FormField from "../ui/FormField";

import { BASE_INPUT_CLASS_NAME } from "../ui/TextInput";

const PasswordField = ({
  id,
  label,
  hint,
  placeholder,
  autoComplete,
  registration,
  error,
  required = false,
  className = "",
  inputClassName = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const hintId = hint && id ? `${id}-hint` : undefined;

  const errorId = error && id ? `${id}-error` : undefined;

  const describedBy = error ? errorId : hintId;

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
      <div className="relative min-w-0">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            BASE_INPUT_CLASS_NAME,

            "pr-12",

            error &&
              [
                "border-red-300",
                "focus:border-red-500",
                "focus:ring-red-100",
              ].join(" "),

            inputClassName,
          )}
          {...registration}
        />

        <button
          type="button"
          onClick={() => setIsVisible((currentValue) => !currentValue)}
          className={[
            "absolute inset-y-0",
            "right-0 grid w-11",
            "place-items-center",
            "rounded-r-xl",
            "text-slate-500",
            "transition-colors",

            "hover:bg-slate-50",
            "hover:text-slate-800",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-inset",
            "focus-visible:ring-blue-500",
          ].join(" ")}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </FormField>
  );
};

export default PasswordField;
