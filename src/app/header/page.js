import React from "react";
import { ThemeContext } from "@/context/useContext";
import Header from "@/components/Chadcn-components/Header";

export default function page() {
  return <Header ThemeContext={ThemeContext} />;
}
