const variantClassNames = {
  matched: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  missing: "bg-red-50 text-red-700 ring-red-100",
  extra: "bg-blue-50 text-blue-700 ring-blue-100",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

const SkillMatchList = ({
  title,
  skills = [],
  emptyMessage = "No skills available.",
  variant = "neutral",
  limit,
}) => {
  const visibleSkills =
    typeof limit === "number" ? skills.slice(0, limit) : skills;

  const remainingCount =
    typeof limit === "number" && skills.length > limit
      ? skills.length - limit
      : 0;

  return (
    <section>
      {title && (
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </p>
      )}

      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className={[
                "rounded-full px-3 py-1 text-xs font-bold ring-1",
                variantClassNames[variant] || variantClassNames.neutral,
              ].join(" ")}
            >
              {skill}
            </span>
          ))}

          {remainingCount > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              +{remainingCount}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default SkillMatchList;
