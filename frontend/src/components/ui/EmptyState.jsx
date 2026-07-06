const EmptyState = ({ icon = "📭", title, description, action }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
