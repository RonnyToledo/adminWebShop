import React from "react";
import { ThemeContext } from "@/context/useContext";
import NewProduct from "@/components/Chadcn-components/NewProduct/NewProduct";

export default function page() {
  return <NewProduct ThemeContext={ThemeContext} />;
}
