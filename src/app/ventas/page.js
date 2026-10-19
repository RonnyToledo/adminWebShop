import React from "react";
import VentasDashboard from "@/components/Chadcn-components/Ventas/VentasDashboard";
import { ThemeContext } from "@/context/useContext";
import { fetchSalesData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchSalesData(user.userId)
    : { data: null };
  return (
    <VentasDashboard ThemeContext={ThemeContext} initialData={result.data} />
  );
}
