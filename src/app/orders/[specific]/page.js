import React from "react";
import { ThemeContext } from "@/context/useContext";
import Component from "@/components/Chadcn-components/Orders/orders-client";

export default async function page({ params }) {
  const { specific } = await params;
  return <Component ThemeContext={ThemeContext} specific={specific} />;
}
