import { NavLink, Outlet } from "react-router-dom";

const DashboardLayout = () => {
  const getSidebarLinkClass = ({ isActive }) => {
    return [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-900 hover:text-white",
    ].join(" ");
  };

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden bg-slate-950 p-6 text-white md:block">
        <NavLink
          to="/"
          className="mb-8 inline-block text-2xl font-extrabold tracking-tight"
        >
          HireFlow
        </NavLink>

        <nav className="grid gap-2">
          <NavLink to="/candidate/dashboard" className={getSidebarLinkClass}>
            Candidate Dashboard
          </NavLink>

          <NavLink to="/company/dashboard" className={getSidebarLinkClass}>
            Company Dashboard
          </NavLink>

          <NavLink to="/jobs" className={getSidebarLinkClass}>
            Public Jobs
          </NavLink>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[72px] items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-700">Dashboard</p>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
