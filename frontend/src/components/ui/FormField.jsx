const FormField = ({ label, htmlFor, hint, error, children }) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          {label}
        </label>
      )}

      {children}

      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}

      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;
