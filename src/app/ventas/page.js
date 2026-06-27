import React from "react";
import VentasDashboard from "@/components/Chadcn-components/Ventas/VentasDashboard";
import { ThemeContext } from "@/context/useContext";

export default function page() {
  return <VentasDashboard ThemeContext={ThemeContext} />;
}
