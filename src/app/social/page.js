import React from "react";
import SocialContactPage from "@/components/Chadcn-components/Social/Social-Contact";
import { fetchSocialData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchSocialData(user.userId)
    : { data: null };
  return <SocialContactPage initialData={result.data} />;
}
