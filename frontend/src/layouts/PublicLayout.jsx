import { Outlet } from "react-router-dom";

import PublicNavbar from "../components/navigation/PublicNavbar";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
