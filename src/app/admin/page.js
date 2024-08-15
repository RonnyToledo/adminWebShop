import React from "react";
import { ThemeContext } from "@/app/admin/layout";
import Dashboard from "@/components/Chadcn-components/Compras";
import Logins from "@/components/Chadcn-components/Logins";

export default function page() {
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          <Logins ThemeContext={ThemeContext} />
          <Dashboard ThemeContext={ThemeContext} />
        </main>
      </div>
    </div>
  );
}
