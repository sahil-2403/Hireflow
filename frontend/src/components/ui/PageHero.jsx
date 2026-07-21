import cn from "../../utils/cn";

const PageHero = ({
  as: Component = "header",
  eyebrow,
  title,
  description,
  actions,
  meta,
  className = "",
}) => {
  return (
    <Component
      className={cn(
        [
          "flex min-w-0",
          "flex-col gap-4",
          "border-b",
          "border-slate-200",
          "pb-5",

          "sm:flex-row",
          "sm:items-start",
          "sm:justify-between",
          "sm:gap-6",
        ].join(" "),
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium leading-5 text-blue-600">
            {eyebrow}
          </p>
        )}

        <h1
          className={cn(
            [
              "text-2xl",
              "font-semibold",
              "leading-8",
              "tracking-tight",
              "text-slate-950",

              "sm:text-3xl",
              "sm:leading-9",
            ].join(" "),

            eyebrow && "mt-1",
          )}
        >
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {(meta || actions) && (
        <div
          className={[
            "flex min-w-0",
            "shrink-0 flex-col",
            "gap-2",

            "sm:items-end",
          ].join(" ")}
        >
          {meta && (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {meta}
            </div>
          )}

          {actions && (
            <div
              className={[
                "flex min-w-0",
                "flex-col gap-2",

                "min-[420px]:flex-row",
                "min-[420px]:flex-wrap",

                "sm:justify-end",
              ].join(" ")}
            >
              {actions}
            </div>
          )}
        </div>
      )}
    </Component>
  );
};

export default PageHero;
