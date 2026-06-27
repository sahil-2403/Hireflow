const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-sm ring-1 ring-slate-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">{message}</p>

          <p className="mt-1 text-xs text-slate-500">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
