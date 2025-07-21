import React from "react";
import { ThemeContext } from "@/context/useContext";
import EditCategory from "@/components/Chadcn-components/EditCategory";

export default async function page({ params }) {
  const uid = (await params).uid;
  return <EditCategory ThemeContext={ThemeContext} uid={uid} />;
}
