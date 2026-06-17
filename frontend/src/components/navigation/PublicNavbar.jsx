import { NavLink } from "react-router-dom";

const PublicNavbar = () => {
  const getNavLinkClass = ({ isActive }) => {
    return [
      "text-sm font-medium transition-colors",
      isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600",
    ].join(" ");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center gap-6 px-4 py-4 sm:px-6 md:flex-nowrap md:py-0 lg:px-8">
        <NavLink
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-600"
        >
          HireFlow
        </NavLink>

        <nav className="order-3 flex w-full items-center gap-6 md:order-none md:w-auto">
          <NavLink to="/" className={getNavLinkClass}>
            Home
          </NavLink>

          <NavLink to="/jobs" className={getNavLinkClass}>
            Jobs
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NavLink
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Login
          </NavLink>

          <NavLink
            to="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Register
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
