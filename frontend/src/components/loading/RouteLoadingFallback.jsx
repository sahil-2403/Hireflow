import { LoaderCircle } from "lucide-react";

const RouteLoadingFallback = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid min-h-[50vh] place-items-center px-4 py-12"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>

        <p className="text-sm font-medium leading-6 text-slate-600">
          Loading page...
        </p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
