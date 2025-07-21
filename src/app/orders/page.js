import React from "react";
import { ThemeContext } from "@/context/useContext";
import { PedidosTable } from "@/components/pedidos-table";

export default function page() {
  return <PedidosTable ThemeContext={ThemeContext} />;
}
