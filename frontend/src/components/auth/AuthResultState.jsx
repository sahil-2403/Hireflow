import cn from "../../utils/cn";

const TONE_CLASS_NAMES = {
  success: {
    container: "bg-emerald-50 text-emerald-700",

    icon: "text-emerald-700",
  },

  error: {
    container: "bg-red-50 text-red-700",

    icon: "text-red-700",
  },

  info: {
    container: "bg-blue-50 text-blue-700",

    icon: "text-blue-700",
  },
};

const AuthResultState = ({
  icon: Icon,
  tone = "info",
  title,
  description,
  actions,
  isLoading = false,
}) => {
  const toneClasses = TONE_CLASS_NAMES[tone] || TONE_CLASS_NAMES.info;

  return (
    <section
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className="py-2 text-center"
    >
      <div
        className={cn(
          [
            "mx-auto grid",
            "h-14 w-14",
            "place-items-center",
            "rounded-2xl",
          ].join(" "),

          toneClasses.container,
        )}
      >
        <Icon
          className={cn(
            "h-7 w-7",
            toneClasses.icon,

            isLoading && "animate-spin",
          )}
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-5 text-2xl font-semibold leading-8 tracking-tight text-slate-950">
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}

      {actions && <div className="mt-6 grid gap-2">{actions}</div>}
    </section>
  );
};

export default AuthResultState;
