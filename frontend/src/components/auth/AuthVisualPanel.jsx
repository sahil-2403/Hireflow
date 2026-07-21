import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

const CONTENT_BY_VARIANT = {
  login: {
    badge: "Jobs and hiring in one place",

    title: "Connect opportunities with the right people.",

    description:
      "HireFlow gives candidates and hiring teams one focused workspace for jobs, applications, and recruitment.",

    features: [
      {
        icon: Search,
        label: "Discover opportunities",
      },
      {
        icon: BriefcaseBusiness,
        label: "Manage hiring",
      },
      {
        icon: LayoutDashboard,
        label: "Track progress",
      },
    ],
  },

  candidate: {
    badge: "Candidate registration",

    title: "Build a profile that helps you stand out.",

    description:
      "Showcase your skills, keep your resume ready, discover jobs, and track every application.",

    features: [
      {
        icon: UserRound,
        label: "Complete profile",
      },
      {
        icon: FileText,
        label: "Resume insights",
      },
      {
        icon: Search,
        label: "Relevant jobs",
      },
    ],
  },

  company: {
    badge: "Company admin registration",

    title: "Create a structured hiring workspace for your team.",

    description:
      "Publish openings, review applicants, invite recruiters, and manage every hiring stage.",

    features: [
      {
        icon: Building2,
        label: "Company workspace",
      },
      {
        icon: UsersRound,
        label: "Recruiter access",
      },
      {
        icon: BriefcaseBusiness,
        label: "Hiring pipeline",
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

const BrowserHeader = () => {
  return (
    <div className="flex h-9 items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4">
      <span className="h-2 w-2 rounded-full bg-red-300" />
      <span className="h-2 w-2 rounded-full bg-amber-300" />
      <span className="h-2 w-2 rounded-full bg-emerald-300" />

      <span className="ml-3 h-2.5 w-28 rounded-full bg-slate-200" />
    </div>
  );
};

const LoginIllustration = () => {
  const jobs = ["Frontend Developer", "Product Designer", "Backend Developer"];

  return (
    <div aria-hidden="true" className="relative h-87.5">
      <div className="absolute bottom-0 left-1/2 h-48 w-[90%] -translate-x-1/2 rounded-full bg-blue-200/45 blur-3xl" />

      <div className="absolute bottom-5 left-1/2 w-[min(92%,500px)] -translate-x-1/2">
        <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/88 shadow-xl shadow-blue-200/40 backdrop-blur">
          <BrowserHeader />

          <div className="grid grid-cols-[95px_1fr]">
            <div className="border-r border-slate-100 bg-slate-50/80 p-3">
              <div className="h-6 w-16 rounded-lg bg-blue-100" />

              <div className="mt-5 grid gap-3">
                <div className="h-2.5 w-full rounded-full bg-slate-200" />
                <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-3/4 rounded-full bg-slate-200" />
                <div className="h-2.5 w-full rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-3.5 w-32 rounded-full bg-slate-800" />

                  <div className="mt-2 h-2.5 w-44 rounded-full bg-slate-200" />
                </div>

                <div className="h-8 w-20 rounded-lg bg-blue-600" />
              </div>

              <div className="mt-5 grid gap-2.5">
                {jobs.map((job, index) => (
                  <div
                    key={job}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div
                        className={[
                          "h-2.5 rounded-full bg-slate-700",

                          index === 0 ? "w-28" : index === 1 ? "w-24" : "w-32",
                        ].join(" ")}
                      />

                      <div className="mt-2 h-2 w-16 rounded-full bg-slate-200" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />

                      <span className="h-2.5 w-10 rounded-full bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-7 w-48 -rotate-3 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg shadow-blue-100/70">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-20 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
          </div>

          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      </div>

      <div className="absolute right-0 top-24 grid h-16 w-16 place-items-center rounded-full border border-white/80 bg-white/85 text-blue-700 shadow-lg">
        <Search className="h-7 w-7" />
      </div>
    </div>
  );
};

const CandidateIllustration = () => {
  return (
    <div aria-hidden="true" className="relative h-87.5">
      <div className="absolute bottom-1 left-1/2 h-48 w-[88%] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="absolute bottom-5 left-1/2 w-[min(82%,400px)] -translate-x-1/2 rounded-[28px] border border-blue-100 bg-white/88 p-5 shadow-xl shadow-blue-200/40 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
            <UserRound className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-32 rounded-full bg-slate-800" />

            <div className="mt-2 h-2.5 w-48 max-w-full rounded-full bg-slate-200" />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="h-6 w-16 rounded-full bg-blue-100" />
              <span className="h-6 w-20 rounded-full bg-violet-100" />
              <span className="h-6 w-14 rounded-full bg-emerald-100" />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />

            <div className="min-w-0 flex-1">
              <div className="h-2.5 w-32 rounded-full bg-slate-700" />

              <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
            </div>

            <BadgeCheck className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="h-2.5 w-16 rounded-full bg-blue-300" />

            <div className="mt-3 h-7 w-12 rounded-lg bg-blue-600" />
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="h-2.5 w-20 rounded-full bg-emerald-300" />

            <div className="mt-3 h-7 w-16 rounded-lg bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-10 w-44 -rotate-3 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-blue-600" />

          <div>
            <div className="h-2.5 w-24 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-16 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-16 w-44 rotate-3 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <BriefcaseBusiness className="h-5 w-5 text-emerald-600" />

          <div>
            <div className="h-2.5 w-20 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyIllustration = () => {
  const stages = [
    {
      label: "Applied",
      tone: "bg-blue-400",
    },
    {
      label: "Interview",
      tone: "bg-violet-400",
    },
    {
      label: "Hired",
      tone: "bg-emerald-400",
    },
  ];

  return (
    <div aria-hidden="true" className="relative h-87.5">
      <div className="absolute bottom-0 left-1/2 h-52 w-[90%] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="absolute bottom-5 left-1/2 w-[min(94%,500px)] -translate-x-1/2 overflow-hidden rounded-[28px] border border-violet-100 bg-white/88 shadow-xl shadow-violet-200/35 backdrop-blur">
        <BrowserHeader />

        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <div className="h-3 w-28 rounded-full bg-slate-800" />

                <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="h-8 w-24 rounded-lg bg-violet-600" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {stages.map((stage, index) => (
              <div
                key={stage.label}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div
                  className={[
                    "h-2.5 rounded-full",
                    stage.tone,

                    index === 0 ? "w-14" : index === 1 ? "w-16" : "w-12",
                  ].join(" ")}
                />

                <div className="mt-4 grid gap-2">
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <div className="h-2 w-full rounded-full bg-slate-200" />

                    <div className="mt-2 h-2 w-3/4 rounded-full bg-slate-100" />
                  </div>

                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <div className="h-2 w-4/5 rounded-full bg-slate-200" />

                    <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-7 w-44 -rotate-3 rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <UsersRound className="h-5 w-5 text-violet-600" />

          <div>
            <div className="h-2.5 w-20 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-16 w-44 rotate-3 rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <BriefcaseBusiness className="h-5 w-5 text-blue-600" />

          <div>
            <div className="h-2.5 w-24 rounded-full bg-slate-700" />

            <div className="mt-2 h-2 w-16 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CompactIllustration = ({ variant }) => {
  const configuration = {
    login: {
      icon: Search,
      background: "from-blue-100 to-indigo-100",
      iconStyle: "bg-blue-600 text-white",
    },

    candidate: {
      icon: FileText,
      background: "from-blue-100 to-emerald-100",
      iconStyle: "bg-emerald-600 text-white",
    },

    company: {
      icon: Building2,
      background: "from-violet-100 to-blue-100",
      iconStyle: "bg-violet-600 text-white",
    },
  };

  const current = configuration[variant] || configuration.login;

  const Icon = current.icon;

  return (
    <div
      aria-hidden="true"
      className={[
        "absolute bottom-3",
        "right-4",
        "h-24 w-28",
        "rounded-2xl",
        "bg-linear-to-br",
        "p-3",
        "shadow-sm",

        "sm:right-6",
        "sm:h-28 sm:w-36",

        "lg:hidden",

        current.background,
      ].join(" ")}
    >
      <div className="h-full rounded-xl border border-white/70 bg-white/65 p-2 backdrop-blur">
        <div
          className={[
            "grid h-9 w-9",
            "place-items-center",
            "rounded-lg",

            current.iconStyle,
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

const AuthVisualPanel = ({ variant = "login" }) => {
  const content = CONTENT_BY_VARIANT[variant] || CONTENT_BY_VARIANT.login;

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

      <CompactIllustration variant={variant} />

      <div className="mt-5 hidden lg:block">
        {variant === "login" && <LoginIllustration />}

        {variant === "candidate" && <CandidateIllustration />}

        {variant === "company" && <CompanyIllustration />}
      </div>
    </div>
  );
};

export default AuthVisualPanel;
