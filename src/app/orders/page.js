import React from "react";
import { ThemeContext } from "@/context/useContext";
import { PedidosTable } from "@/components/Chadcn-components/Orders/pedidos-table";
import { fetchStoreShellData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchStoreShellData(user.userId)
    : { data: null };
  return <PedidosTable ThemeContext={ThemeContext} initialData={result.data} />;
}
