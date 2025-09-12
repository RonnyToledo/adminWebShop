import React from "react";
import { ThemeContext } from "@/context/useContext";
import { Marketing } from "@/components/Chadcn-components/codeDiscount/marketing";

export default function page() {
  return <Marketing ThemeContext={ThemeContext} />;
}
