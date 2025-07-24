import React from "react";
import { ThemeContext } from "@/context/useContext";

import Component from "@/components/dashboard-welcome";

export default function usePage() {
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          <Component ThemeContext={ThemeContext} />
        </main>
      </div>
    </div>
  );
}
