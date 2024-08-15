import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import NewProduct from "@/components/Chadcn-components/NewProduct";

export default function page() {
  return <NewProduct ThemeContext={ThemeContext} />;
}
