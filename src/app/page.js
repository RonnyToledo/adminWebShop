import React from "react";
import DashboardHome from "@/components/Chadcn-components/Home/DashboardHome";
import { fetchDashboardData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function usePage() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchDashboardData(user.userId)
    : { data: null };
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          <DashboardHome initialData={result.data} />
        </main>
      </div>
    </div>
  );
}
