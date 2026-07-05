import { useState } from "react";

import FieldError from "./FieldError";

const PasswordField = ({
  id,
  label,
  placeholder,
  autoComplete,
  registration,
  error,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={[
            "w-full rounded-xl border bg-white px-3 py-2.5 pr-12 text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400 focus:ring-4",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-50"
              : "border-slate-200 focus:border-blue-500 focus:ring-blue-50",
          ].join(" ")}
          {...registration}
        />

        <button
          type="button"
          onClick={() => setIsVisible((currentValue) => !currentValue)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-blue-50"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 4.2A10.8 10.8 0 0112 4c5 0 9 4 10 8a11.8 11.8 0 01-2.1 4.1" />
              <path d="M6.6 6.6A11.5 11.5 0 002 12c1 4 5 8 10 8a10.8 10.8 0 005.4-1.4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <FieldError message={error} />
    </div>
  );
};

export default PasswordField;
