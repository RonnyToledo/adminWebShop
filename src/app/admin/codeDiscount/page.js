import React from "react";
import { ThemeContext } from "@/context/useContext";
import { Marketing } from "@/components/component/marketing";

export default function page() {
  return <Marketing ThemeContext={ThemeContext} />;
}
