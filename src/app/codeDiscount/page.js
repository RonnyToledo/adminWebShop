import React from "react";
import { ThemeContext } from "@/context/useContext";
import { Marketing } from "@/components/Chadcn-components/CodeDiscount/marketing";

export default function page() {
  return <Marketing ThemeContext={ThemeContext} />;
}
