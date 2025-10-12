"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logOut } from "@/components/globalFunction/loginFunction";

export default function LogoutPage() {
  const router = useRouter();

  return (
    <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100vw] min-h-[100vh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
      <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <ComputerIcon className="h-12 w-12" />
          <h1 className="text-2xl font-bold ml-4">WebShop no existente</h1>
        </div>
        <p className="mb-6 text-lg text-center">
          Su tienda parece no estar activa o no existe
        </p>
        <p className="mb-6 text-base text-center">
          Por favor, comuníquese con los administradores para la
          creación/activación de su tienda online. Gracias y disculpe las
          molestias.
        </p>
        <Button onClick={() => logOut(router)}>Cerrar sesión</Button>
      </div>
    </div>
  );
}

function ComputerIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="8" x="5" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h2" />
      <path d="M12 18h6" />
    </svg>
  );
}
