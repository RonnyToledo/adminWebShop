import React from "react";
import HeaderWelcome from "@/components/component/header-welcome";

export default function RootLayout({ children }) {
  return (
    <main>
      <HeaderWelcome>{children}</HeaderWelcome>
    </main>
  );
}
