import React from "react";
import Guia from "@/components/Chadcn-components/Guide/Guia";
import { fetchGuideData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchGuideData(user.userId)
    : { data: null };
  return <Guia initialData={result.data} />;
}
