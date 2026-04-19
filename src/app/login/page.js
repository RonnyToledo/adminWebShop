import React from "react";
import { ResponsiveLogin } from "@/components/Chadcn-components/Login/responsive-login";
import { getServerUser } from "@/lib/server-auth";

export default async function usePage() {
  const userData = await getServerUser();
  const userId = userData?.userId ?? null;
  if (userId) {
    console.info("Usuario recibido:", userId);
  } else {
    console.warn("No hay usuario, redirigiendo a login");
  }
  if (userId) console.info("Usuario recivido");
  return <ResponsiveLogin user={userId} />;
}
