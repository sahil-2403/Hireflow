import cn from "../../utils/cn";

const FilterChips = ({
  chips = [],
  onRemove,
  onClear,
  label = "Active filters:",
  clearLabel = "Clear all",
  className = "",
}) => {
  if (!chips.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5",
        className,
      )}
    >
      {label && (
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove?.(chip.key)}
          className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
        >
          {chip.label} ×
        </button>
      ))}

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
};

export default FilterChips;
