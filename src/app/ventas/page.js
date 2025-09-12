import React from "react";
import Dashboard from "@/components/Chadcn-components/Ventas/Compras";
import { ThemeContext } from "@/context/useContext";

export default function page() {
  return <Dashboard ThemeContext={ThemeContext} />;
}
