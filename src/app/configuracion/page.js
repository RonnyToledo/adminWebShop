import React from "react";
import { ThemeContext } from "@/context/useContext";
import Configuracion from "@/components/Chadcn-components/Configuracion/Configuracion";

export default async function page() {
  const country = await fetch(
    `${process.env.NEXT_PUBLIC_PATH}/api/filter/country`
  );
  const res = await country.json();
  return <Configuracion ThemeContext={ThemeContext} country={res} />;
}
