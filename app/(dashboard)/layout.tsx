import React from "react";

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ThemeWrapper } from "@/components/auth/theme-wrapper";
import NavBar from "@/components/layout/NavBar";
import Sidebar from "@/components/layout/Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthWrapper>
      <ThemeWrapper>
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </ThemeWrapper>
    </AuthWrapper>
  );
};

export default DashboardLayout;
