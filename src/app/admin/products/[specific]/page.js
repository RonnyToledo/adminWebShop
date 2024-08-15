import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Specific from "@/components/Chadcn-components/Specific";

export default function page({ params }) {
  return <Specific ThemeContext={ThemeContext} specific={params.specific} />;
}
