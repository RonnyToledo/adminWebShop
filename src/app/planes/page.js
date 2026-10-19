import React from "react";
import PlanesPage from "@/components/Chadcn-components/Planes/PlanesPage";
import { fetchStoreShellData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";
export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchStoreShellData(user.userId)
    : { data: null };
  return <PlanesPage initialData={result.data} />;
}
