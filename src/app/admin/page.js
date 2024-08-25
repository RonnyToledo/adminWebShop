"use client";
import React, { useContext } from "react";
import { ThemeContext } from "@/app/admin/layout";
import Dashboard from "@/components/Chadcn-components/Compras";
import Logins from "@/components/Chadcn-components/Logins";
import Guia from "@/components/Chadcn-components/Guia";

export default function usePage() {
  const { webshop, setwebshop } = useContext(ThemeContext);

  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          {webshop.store.plan == "basic" ? (
            <Guia ThemeContext={ThemeContext} />
          ) : (
            <>
              <Logins ThemeContext={ThemeContext} />
              <Dashboard ThemeContext={ThemeContext} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
