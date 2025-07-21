import React from "react";
import { Toaster } from "@/components/ui/toaster";

export default function ConfigPageLayout({ children }) {
  return (
    <main>
      {children}
      <Toaster />
    </main>
  );
}
