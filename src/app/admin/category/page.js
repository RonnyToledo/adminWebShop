import React from "react";
import { ThemeContext } from "@/context/useContext";
import Category from "@/components/Chadcn-components/Category";

export default function page() {
  return <Category ThemeContext={ThemeContext} />;
}
