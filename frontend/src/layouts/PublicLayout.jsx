import { Outlet } from "react-router-dom";

import PublicNavbar from "../components/navigation/PublicNavbar";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />

      <Outlet />
    </div>
  );
};

export default PublicLayout;