import React from "react";
import { ThemeContext } from "@/context/useContext";
import Domicilios from "@/components/Chadcn-components/Configuracion/Domicilios";

export default function page() {
  return <Domicilios ThemeContext={ThemeContext} />;
}
