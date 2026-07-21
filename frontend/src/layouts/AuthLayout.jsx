import { Outlet } from "react-router-dom";

import PublicNavbar from "../components/navigation/PublicNavbar";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />

      <main id="main-content" className="min-h-[calc(100dvh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
