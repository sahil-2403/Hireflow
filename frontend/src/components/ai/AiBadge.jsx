const AiBadge = ({ children = "AI powered", className = "" }) => {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border border-violet-200 bg-linear-to-r",
        "from-violet-50 to-blue-50 px-2.5 py-1",
        "text-xs font-black uppercase tracking-wider text-violet-600",
        className,
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-amber-300">
        ⚡
      </span>
      {children}
    </span>
  );
};

export default AiBadge;
