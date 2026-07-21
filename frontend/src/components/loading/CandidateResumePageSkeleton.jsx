import Skeleton from "../ui/Skeleton";

const CandidateResumePageSkeleton = () => {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading resume details</span>

      <header className="grid gap-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />

            <div className="grid gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>

          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
      </section>

      <section
        className={[
          "rounded-2xl border",
          "border-violet-200",
          "bg-violet-50/40",
          "p-4 sm:p-5",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-violet-200/80" />

          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-36 bg-violet-200/80" />
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        </div>

        <Skeleton className="mt-5 h-16 w-full bg-white/80" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />

          <Skeleton className="mt-5 h-11 w-full" />
          <Skeleton className="mt-4 h-16 w-full" />

          <div className="mt-5 flex justify-end">
            <Skeleton className="h-10 w-full sm:w-36" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>

          <Skeleton className="mt-4 h-2 w-full rounded-full" />

          <div className="mt-5 grid gap-3">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CandidateResumePageSkeleton;
