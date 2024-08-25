import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Product from "@/components/Chadcn-components/Product";

export default function page() {
  return <Product ThemeContext={ThemeContext} />;
}
