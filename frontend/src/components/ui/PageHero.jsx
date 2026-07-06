const PageHero = ({ eyebrow, title, description, actions, meta }) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-slate-50 shadow-sm">
      <div className="flex flex-col gap-5 p-6 sm:px-8 sm:py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-tight text-blue-600 sm:tracking-wider">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-3 text-xl font-black text-slate-950 sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-4xl text-xs leading-6 text-slate-600 sm:text-base">
              {description}
            </p>
          )}
        </div>

        {(actions || meta) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHero;
