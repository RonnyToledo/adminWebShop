import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Domicilios from "@/components/Chadcn-components/Domicilios";

export default function page() {
  return <Domicilios ThemeContext={ThemeContext} />;
}
