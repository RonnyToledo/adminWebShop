import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Category from "@/components/Chadcn-components/Category";

export default function page() {
  return <Category ThemeContext={ThemeContext} />;
}
