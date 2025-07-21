import React from "react";
import { ThemeContext } from "@/context/useContext";
import Theme from "@/components/component/theme";

export default function page() {
  return <Theme ThemeContext={ThemeContext} />;
}
