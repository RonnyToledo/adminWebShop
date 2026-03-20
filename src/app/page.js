import React from "react";
import DashboardHome from "@/components/Chadcn-components/Home/DashboardHome";

export default function usePage() {
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          <DashboardHome />
        </main>
      </div>
    </div>
  );
}
