import React from "react";
import { ThemeContext } from "@/context/useContext";
import Theme from "@/components/Chadcn-components/Theme/theme";

export default function page() {
  return <Theme ThemeContext={ThemeContext} />;
}
