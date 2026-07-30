import cn from "../../utils/cn";

const THEME_CLASS_NAMES = {
  login: {
    background: [
      "bg-linear-to-br",
      "from-slate-50",
      "via-blue-50/80",
      "to-white",
    ].join(" "),

    glowOne: "bg-blue-300/35",

    glowTwo: "bg-indigo-200/30",
  },

  candidate: {
    background: [
      "bg-linear-to-br",
      "from-sky-50",
      "via-white",
      "to-emerald-50/80",
    ].join(" "),

    glowOne: "bg-blue-300/35",

    glowTwo: "bg-emerald-200/35",
  },

  company: {
    background: [
      "bg-linear-to-br",
      "from-violet-50",
      "via-white",
      "to-blue-50/90",
    ].join(" "),

    glowOne: "bg-violet-300/35",

    glowTwo: "bg-blue-200/35",
  },

  recovery: {
    background: [
      "bg-linear-to-br",
      "from-slate-50",
      "via-blue-50/85",
      "to-amber-50/70",
    ].join(" "),

    glowOne: "bg-blue-300/30",

    glowTwo: "bg-amber-200/30",
  },

  verification: {
    background: [
      "bg-linear-to-br",
      "from-emerald-50/80",
      "via-white",
      "to-blue-50/90",
    ].join(" "),

    glowOne: "bg-emerald-200/35",

    glowTwo: "bg-blue-200/35",
  },
};

const AuthPageShell = ({
  variant = "login",
  scene,
  children,
  formClassName = "",
}) => {
  const theme = THEME_CLASS_NAMES[variant] || THEME_CLASS_NAMES.login;

  return (
    <section
      className={cn(
        [
          "relative isolate",
          "min-h-[calc(100dvh-4rem)]",
          "overflow-hidden",
        ].join(" "),

        theme.background,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          [
            "pointer-events-none",
            "absolute -left-28",
            "-top-32",
            "h-96 w-96",
            "rounded-full",
            "blur-3xl",
          ].join(" "),

          theme.glowOne,
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          [
            "pointer-events-none",
            "absolute -bottom-40",
            "right-0",
            "h-120",
            "w-120",
            "rounded-full",
            "blur-3xl",
          ].join(" "),

          theme.glowTwo,
        )}
      />

      <div
        className={[
          "relative mx-auto grid",
          "w-full max-w-350",
          "min-w-0",

          "lg:min-h-[calc(100dvh-4rem)]",
          "lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.85fr)]",
        ].join(" ")}
      >
        <div
          className={[
            "relative min-w-0",
            "min-h-55",
            "px-4 pb-4 pt-6",

            "sm:min-60",
            "sm:px-6 sm:pt-8",

            "lg:min-h-[calc(100dvh-4rem)]",
            "lg:px-10 lg:py-9",

            "xl:px-14 xl:py-10",
          ].join(" ")}
        >
          {scene}
        </div>

        <div
          className={[
            "relative flex min-w-0",
            "items-start justify-center",
            "px-4 pb-8",

            "sm:px-6",

            "lg:px-8",
            "lg:pb-8",
            "lg:pt-8",

            "xl:px-10",
          ].join(" ")}
        >
          <div
            className={cn(
              [
                "w-full",
                "rounded-2xl",
                "border",
                "border-white/80",
                "bg-white/82",
                "p-5",
                "shadow-xl",
                "shadow-slate-300",
                "backdrop-blur-xl",

                "sm:p-6",
                "lg:p-7",
              ].join(" "),

              formClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPageShell;
