import React from "react";
import { ThemeContext } from "@/context/useContext";
import Configuracion from "@/components/Chadcn-components/Configuracion";

export default function page() {
  return <Configuracion ThemeContext={ThemeContext} />;
}
