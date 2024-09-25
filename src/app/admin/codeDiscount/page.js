import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import { Marketing } from "@/components/component/marketing";

export default function page() {
  return <Marketing ThemeContext={ThemeContext} />;
}
