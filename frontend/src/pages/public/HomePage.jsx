import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { listPublicJobs } from "../../api/job.api";

import ApiStatus from "../../components/common/ApiStatus";

const popularFilters = [
  {
    label: "Remote",
    to: "/jobs?workplaceType=remote",
  },
  {
    label: "Hybrid",
    to: "/jobs?workplaceType=hybrid",
  },
  {
    label: "Full-time",
    to: "/jobs?employmentType=full-time",
  },
  {
    label: "Internship",
    to: "/jobs?employmentType=internship",
  },
];

const candidateSteps = [
  {
    label: "Complete profile",
    description: "Add your personal details and experience.",
    icon: "👤",
  },
  {
    label: "Upload resume",
    description: "Upload your resume to stand out.",
    icon: "📄",
  },
  {
    label: "Apply to jobs",
    description: "Find jobs and apply in a few clicks.",
    icon: "✈️",
  },
  {
    label: "Track application status",
    description: "Track your applications and get updates.",
    icon: "☑️",
  },
];

const candidateProcess = [
  "Create account",
  "Complete profile and resume",
  "Apply and track status",
];

const companyProcess = [
  "Create/manage job posts",
  "Review applications",
  "Move candidates through hiring stages",
];

const featureCards = [
  {
    icon: "👤",
    title: "Candidate profile",
    description: "Build a complete profile to showcase your experience.",
  },
  {
    icon: "☁️",
    title: "Resume upload",
    description: "Upload your resume and keep it ready for applications.",
  },
  {
    icon: "🔎",
    title: "Job search",
    description: "Search and filter jobs that match your skills.",
  },
  {
    icon: "⏱️",
    title: "Application tracking",
    description: "Track your applications and hiring status.",
  },
  {
    icon: "🏢",
    title: "Company dashboard",
    description: "Manage jobs, applications, and company profile.",
  },
  {
    icon: "👥",
    title: "Recruiter management",
    description: "Add team members and manage recruiter access.",
  },
];

const formatJobMeta = (job) => {
  return [job.location, job.employmentType, job.workplaceType]
    .filter(Boolean)
    .join(" · ");
};

const HomeButton = ({
  children,
  to,
  type = "button",
  variant = "primary",
  className = "",
}) => {
  const baseClassName =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70";

  const variantClassName = {
    primary:
      "bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-100",
    dark: "bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-200",
    green:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-100",
  };

  const finalClassName = [baseClassName, variantClassName[variant], className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={finalClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={finalClassName}>
      {children}
    </button>
  );
};

const SectionHeading = ({ eyebrow, title, description, centered = true }) => {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
};

const VisualMosaic = () => {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.9fr] lg:px-8">
      <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-blue-50 ring-1 ring-blue-100">
        <div className="absolute inset-8 rounded-[1.5rem] bg-white shadow-sm" />

        <div className="absolute left-14 top-14 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
          Candidate workspace
        </div>

        <div className="absolute left-1/2 top-24 h-28 w-28 -translate-x-1/2 rounded-full bg-blue-200" />
        <div className="absolute left-1/2 top-40 h-44 w-40 -translate-x-1/2 rounded-[2rem] bg-blue-600" />

        <div className="absolute bottom-12 left-14 right-14 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-950">
            Profile, resume, and applications
          </p>

          <div className="mt-4 grid gap-3">
            <div className="h-3 w-3/4 rounded-full bg-slate-200" />
            <div className="h-3 w-1/2 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[2rem] bg-gradient-to-br from-orange-100 to-blue-100 p-8 ring-1 ring-slate-200">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">
              Candidate flow
            </h3>

            <div className="mt-5 grid gap-4">
              {candidateProcess.map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {index + 1}
                  </span>

                  <span className="text-sm font-bold text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <h3 className="text-3xl font-black">Clean hiring workflow</h3>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            A practical MERN hiring platform for candidates, recruiters, and
            company owners.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[2rem] bg-emerald-50 p-8 ring-1 ring-emerald-100">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">
              Company workspace
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage jobs, applications, company profile, and recruiter access.
            </p>

            <HomeButton to="/login" variant="green" className="mt-5 w-full">
              Login to dashboard
            </HomeButton>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 ring-1 ring-slate-200">
          <h3 className="text-xl font-black text-slate-950">
            Supported actions
          </h3>

          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <p>✓ Apply to jobs</p>
            <p>✓ View uploaded resume</p>
            <p>✓ Move hiring stages</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProcessCard = ({ title, icon, accent = "blue", items }) => {
  const accentClassName =
    accent === "green" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white";

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-4">
        <div
          className={[
            "grid h-14 w-14 place-items-center rounded-2xl text-2xl",
            accent === "green"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700",
          ].join(" ")}
        >
          {icon}
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">Role-based workflow</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-4">
            <span
              className={[
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black",
                accentClassName,
              ].join(" ")}
            >
              {index + 1}
            </span>

            <p className="font-bold text-slate-800">{item}</p>
          </div>
        ))}
      </div>
    </article>
  );
};

const LatestJobsSection = () => {
  const [status, setStatus] = useState("loading");
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchLatestJobs = async () => {
      try {
        const result = await listPublicJobs({
          page: 1,
          limit: 3,
          sortBy: "createdAt",
          order: "desc",
        });

        if (shouldIgnore) {
          return;
        }

        setJobs(result.data?.jobs ?? []);
        setStatus("success");
      } catch {
        if (shouldIgnore) {
          return;
        }

        setJobs([]);
        setStatus("error");
      }
    };

    fetchLatestJobs();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
      <div>
        <SectionHeading
          centered={false}
          eyebrow="Open roles"
          title="Explore jobs on HireFlow"
          description="Browse public job posts added by companies. If there are no active jobs yet, candidates can still open the jobs page and check again later."
        />

        <div className="mt-8 rounded-[2rem] bg-blue-50 p-8 ring-1 ring-blue-100">
          <h3 className="text-2xl font-black text-blue-700">
            Job search first
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            The homepage focuses on the main user action: finding relevant jobs
            quickly and continuing to the full jobs page.
          </p>

          <HomeButton to="/jobs" className="mt-6">
            Browse all jobs
          </HomeButton>
        </div>
      </div>

      <div className="grid gap-4">
        {status === "loading" && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-600">
            Loading latest jobs...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            Could not load latest jobs right now.
          </div>
        )}

        {status === "success" && jobs.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-black text-slate-950">
              No jobs published yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Jobs will appear here when companies publish open roles.
            </p>
          </div>
        )}

        {status === "success" &&
          jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-950 group-hover:text-blue-700">
                    {job.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatJobMeta(job) || "Job details available"}
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition group-hover:border-blue-200 group-hover:text-blue-700">
                  View →
                </span>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("search", keyword.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    const queryString = params.toString();

    navigate(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <main className="bg-slate-50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <section className="bg-gradient-to-br from-white via-white to-blue-50 px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-8 flex justify-center">
              <ApiStatus />
            </div>

            <h1 className="mx-auto mt-7 max-w-5xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Find jobs that match your skills and career goals
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Browse jobs, apply with your profile, upload resume, and track
              applications from one clean dashboard.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="mx-auto mt-8 grid max-w-4xl gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1.2fr_0.8fr_auto]"
            >
              <label className="sr-only" htmlFor="keyword">
                Job title, keyword, or skill
              </label>
              <input
                id="keyword"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Job title, keyword, or skill"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <label className="sr-only" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="search"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <HomeButton type="submit" className="px-8">
                Search jobs
              </HomeButton>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-slate-600">Popular:</span>

              {popularFilters.map((filter) => (
                <Link
                  key={filter.label}
                  to={filter.to}
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <HomeButton to="/jobs" className="sm:min-w-52">
                Browse all jobs
              </HomeButton>

              <HomeButton
                to="/register"
                variant="secondary"
                className="sm:min-w-64"
              >
                Create candidate account
              </HomeButton>
            </div>
          </div>
        </section>

        <VisualMosaic />

        <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Choose how you want to use HireFlow" />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm sm:p-8">
                <div className="grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-3xl text-blue-700 shadow-sm">
                    👤
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-blue-700">
                      Candidate
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Browse jobs, apply, upload resume, and track applications.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <HomeButton to="/register">
                      Create candidate account
                    </HomeButton>
                    <HomeButton to="/jobs" variant="secondary">
                      Browse jobs
                    </HomeButton>
                  </div>
                </div>
              </article>

              <article className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 shadow-sm sm:p-8">
                <div className="grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-3xl text-emerald-700 shadow-sm">
                    💼
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-emerald-700">
                      Company / Recruiter
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Manage jobs, applications, company profile, and recruiter
                      access.
                    </p>
                  </div>

                  <HomeButton to="/login" variant="green">
                    Login to dashboard
                  </HomeButton>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              title="A smooth process with practical hiring tools"
              description="The homepage stays focused on the real flows already available in HireFlow."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <ProcessCard
                title="For candidates"
                icon="👤"
                items={candidateProcess}
              />

              <ProcessCard
                title="For companies"
                icon="💼"
                accent="green"
                items={companyProcess}
              />
            </div>
          </div>
        </section>

        <LatestJobsSection />

        <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Built for a clean hiring workflow" />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
                    {feature.icon}
                  </div>

                  <h3 className="mt-5 font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-blue-100 bg-blue-50 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Ready to take the next step?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Browse opportunities or login to your account.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <HomeButton to="/jobs" className="sm:min-w-40">
                Browse jobs
              </HomeButton>

              <HomeButton
                to="/login"
                variant="secondary"
                className="sm:min-w-32"
              >
                Login
              </HomeButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
