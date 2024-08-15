import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Configuracion from "@/components/Chadcn-components/Configuracion";

export default function page() {
  return <Configuracion ThemeContext={ThemeContext} />;
}
