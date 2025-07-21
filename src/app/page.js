"use client";
import React, { useContext, useEffect } from "react";
import { ThemeContext } from "../context/useContext";
import Dashboard from "@/components/Chadcn-components/Compras";
import Logins from "@/components/Chadcn-components/Logins";
import Guia from "@/components/Chadcn-components/Guia";
import Loading from "@/components/component/loading";

export default function usePage() {
  const { webshop, setwebshop } = useContext(ThemeContext);

  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col">
          {webshop.store?.plan == "basic" ? (
            <Guia ThemeContext={ThemeContext} />
          ) : webshop.store?.plan == "pro" ||
            webshop.store?.plan == "custom" ? (
            <>
              <Logins ThemeContext={ThemeContext} />
              <Dashboard ThemeContext={ThemeContext} />
            </>
          ) : (
            <Loading />
          )}
        </main>
      </div>
    </div>
  );
}
