import React from "react";
import { ThemeContext } from "@/context/useContext";
import Domicilios from "@/components/Chadcn-components/Configuracion/Domicilios";
import { fetchDeliveryData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchDeliveryData(user.userId)
    : { data: null };
  return <Domicilios ThemeContext={ThemeContext} initialData={result.data} />;
}
