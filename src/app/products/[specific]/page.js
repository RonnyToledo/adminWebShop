import React from "react";
import { ThemeContext } from "@/context/useContext";
import Specific from "@/components/Chadcn-components/Specific";

export default async function page({ params }) {
  const specific = (await params).specific;
  return <Specific ThemeContext={ThemeContext} specific={specific} />;
}
