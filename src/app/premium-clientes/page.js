import React from "react";
import PremiumMembers from "@/components/Chadcn-components/Category/PremiumMembers.jsx";
import { fetchPremiumData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function Page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchPremiumData(user.userId)
    : { data: null };
  return <PremiumMembers initialData={result.data} />;
}
