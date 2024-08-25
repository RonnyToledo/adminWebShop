import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Links from "@/components/Chadcn-components/Links";

export default function page() {
  return <Links ThemeContext={ThemeContext} />;
}
