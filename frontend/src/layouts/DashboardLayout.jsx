import { Outlet } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import PublicNavbar from "../components/navigation/PublicNavbar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar variant="dashboard" />

      <main id="main-content" className="min-h-[calc(100dvh-4rem)]">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};

export default DashboardLayout;
