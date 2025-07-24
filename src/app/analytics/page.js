"use client";

import React, { useContext } from "react";
import Logins from "@/components/Chadcn-components/Logins";
import { ThemeContext } from "@/context/useContext";

export default function Page() {
  const { webshop, setwebshop } = useContext(ThemeContext);

  return (
    <div>
      <Logins ThemeContext={ThemeContext} />
    </div>
  );
}
