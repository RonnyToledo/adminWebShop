import React from "react";
import { ResponsiveLogin } from "@/components/Chadcn-components/Login/responsive-login";
import { checkUser } from "../layout";

export default async function usePage() {
  const { userId } = await checkUser();
  if (userId) {
    console.info("Usuario recibido:", userId);
  } else {
    console.warn("No hay usuario, redirigiendo a login");
  }
  if (userId) console.info("Usuario recivido");
  return <ResponsiveLogin user={userId} />;
}
