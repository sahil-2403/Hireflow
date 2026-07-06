const PageHero = ({ eyebrow, title, description, actions, meta }) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-slate-50 shadow-sm">
      <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
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
