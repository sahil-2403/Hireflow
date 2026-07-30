import {
  AtSign,
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const CONTENT_BY_VARIANT = {
  recovery: {
    badge: "Secure account recovery",

    title: "Recover access without losing your progress.",

    description:
      "Use your registered email to securely restore access to your HireFlow account.",

    features: [
      {
        icon: AtSign,
        label: "Registered email",
      },
      {
        icon: ShieldCheck,
        label: "Secure reset link",
      },
      {
        icon: LockKeyhole,
        label: "New password",
      },
    ],
  },

  verification: {
    badge: "Email verification",

    title: "Confirm your email and activate your workspace.",

    description:
      "Email verification protects your account and unlocks your HireFlow workspace.",

    features: [
      {
        icon: Mail,
        label: "Verification email",
      },
      {
        icon: BadgeCheck,
        label: "Confirm identity",
      },
      {
        icon: CheckCircle2,
        label: "Activate account",
      },
    ],
  },
};

const FeatureRow = ({ icon: Icon, label }) => {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/80 bg-white/65 px-3 py-2.5 backdrop-blur-sm">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <span className="text-xs font-medium leading-5 text-slate-700">
        {label}
      </span>
    </div>
  );
};

const RecoveryIllustration = () => {
  return (
    <div aria-hidden="true" className="relative h-87.5">
      <div className="absolute bottom-3 left-1/2 h-48 w-[88%] -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="absolute bottom-5 left-1/2 w-[min(86%,430px)] -translate-x-1/2 rounded-[28px] border border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-200/35 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="h-3 w-36 rounded-full bg-slate-800" />

            <div className="mt-2 h-2 w-48 max-w-full rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <div className="mb-2 h-2.5 w-20 rounded-full bg-slate-300" />

            <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
              <AtSign className="h-4 w-4 text-slate-400" />

              <div className="h-2.5 w-36 rounded-full bg-slate-200" />
            </div>
          </div>

          <div>
            <div className="mb-2 h-2.5 w-24 rounded-full bg-slate-300" />

            <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-slate-400" />

                <div className="flex gap-1.5">
                  {Array.from({
                    length: 8,
                  }).map((_, index) => (
                    <span
                      key={index}
                      className="h-2 w-2 rounded-full bg-slate-300"
                    />
                  ))}
                </div>
              </div>

              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          <div className="h-10 rounded-xl bg-blue-600" />
        </div>
      </div>

      <div className="absolute left-1 top-10 grid h-20 w-20 -rotate-6 place-items-center rounded-3xl border border-white/80 bg-white/85 text-blue-700 shadow-lg backdrop-blur">
        <KeyRound className="h-9 w-9" />
      </div>

      <div className="absolute right-0 top-16 w-44 rotate-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />

          <div>
            <div className="h-2.5 w-20 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

const VerificationIllustration = () => {
  return (
    <div aria-hidden="true" className="relative h-87.5">
      <div className="absolute bottom-3 left-1/2 h-48 w-[88%] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="absolute bottom-6 left-1/2 w-[min(84%,420px)] -translate-x-1/2">
        <div className="relative rounded-[30px] border border-emerald-100 bg-white/88 p-6 shadow-xl shadow-emerald-200/35 backdrop-blur">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Mail className="h-8 w-8" />
          </div>

          <div className="mx-auto mt-5 h-3.5 w-40 rounded-full bg-slate-800" />

          <div className="mx-auto mt-3 h-2.5 w-64 max-w-full rounded-full bg-slate-200" />

          <div className="mx-auto mt-2 h-2.5 w-48 max-w-full rounded-full bg-slate-200" />

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                <AtSign className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-32 rounded-full bg-slate-700" />

                <div className="mt-2 h-2 w-44 max-w-full rounded-full bg-slate-200" />
              </div>

              <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-8 w-44 -rotate-3 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <MailCheck className="h-5 w-5 text-blue-600" />

          <div>
            <div className="h-2.5 w-20 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-20 grid h-16 w-16 rotate-6 place-items-center rounded-full border border-white/80 bg-white/85 text-emerald-600 shadow-lg">
        <CheckCircle2 className="h-7 w-7" />
      </div>
    </div>
  );
};

const CompactVisual = ({ variant }) => {
  const isVerification = variant === "verification";

  const Icon = isVerification ? MailCheck : KeyRound;

  return (
    <div
      aria-hidden="true"
      className={[
        "absolute bottom-3",
        "right-4",
        "h-24 w-28",
        "rounded-2xl",
        "bg-linear-to-br",
        "p-3 shadow-sm",

        "sm:right-6",
        "sm:h-28 sm:w-36",

        "lg:hidden",

        isVerification
          ? ["from-emerald-100", "to-blue-100"].join(" ")
          : ["from-blue-100", "to-amber-100"].join(" "),
      ].join(" ")}
    >
      <div className="h-full rounded-xl border border-white/70 bg-white/65 p-2 backdrop-blur">
        <div
          className={[
            "grid h-9 w-9",
            "place-items-center",
            "rounded-lg text-white",

            isVerification ? "bg-emerald-600" : "bg-blue-600",
          ].join(" ")}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="mt-3 h-2.5 w-16 rounded-full bg-slate-500/50" />

        <div className="mt-2 h-2 w-12 rounded-full bg-slate-400/35" />
      </div>
    </div>
  );
};

const AuthSupportVisualPanel = ({ variant = "recovery" }) => {
  const content = CONTENT_BY_VARIANT[variant] || CONTENT_BY_VARIANT.recovery;

  return (
    <div className="relative z-10 min-h-full">
      <div className="max-w-xl pr-28 sm:pr-40 lg:pr-0">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-blue-700 backdrop-blur">
          <Sparkles className="h-3 w-3" aria-hidden="true" />

          {content.badge}
        </span>

        <h1 className="mt-4 text-2xl font-semibold leading-8 tracking-tight text-slate-950 sm:text-3xl sm:leading-9 lg:text-4xl lg:leading-[1.15]">
          {content.title}
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
          {content.description}
        </p>

        <div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
          {content.features.map((feature) => (
            <FeatureRow key={feature.label} {...feature} />
          ))}
        </div>
      </div>

      <CompactVisual variant={variant} />

      <div className="mt-5 hidden lg:block">
        {variant === "verification" ? (
          <VerificationIllustration />
        ) : (
          <RecoveryIllustration />
        )}
      </div>
    </div>
  );
};

export default AuthSupportVisualPanel;
