import React from "react";
import { ThemeContext } from "@/context/useContext";
import { PedidosTable } from "@/components/Chadcn-components/Orders/pedidos-table";

export default function page() {
  return <PedidosTable ThemeContext={ThemeContext} />;
}
