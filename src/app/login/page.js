import React from "react";
import { ResponsiveLogin } from "@/components/Chadcn-components/Login/responsive-login";
import { fetchUserSessionServer } from "@/components/globalFunction/loginFunction";

export default async function usePage() {
  const userSession = await fetchUserSessionServer();
  const user = userSession?.id;
  if (user) console.info("Usuario recivido");
  return <ResponsiveLogin user={user} />;
}
