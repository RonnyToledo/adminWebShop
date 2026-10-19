import React from "react";
import Logins from "@/components/Chadcn-components/Analytics/Logins";
import { ThemeContext } from "@/context/useContext";
import { fetchAnalyticsData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function Page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchAnalyticsData(user.userId)
    : { data: null };

  return (
    <div>
      <Logins ThemeContext={ThemeContext} initialData={result.data} />
    </div>
  );
}
