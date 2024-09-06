import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Theme from "@/components/component/theme";

export default function page() {
  return <Theme ThemeContext={ThemeContext} />;
}
