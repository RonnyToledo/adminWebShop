import React from "react";
import ResponsiveLogin from "@/components/Chadcn-components/Login/responsive-login";
import { getServerUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";

// Next.js App Router pasa searchParams como prop al page —
// no hace falta headers() ni middleware para leer ?add=true.
export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const isAddMode = params?.add === "true";

  const userData = await getServerUser();
  const userId = userData?.userId ?? null;

  if (userId && !isAddMode) {
    console.info("[login/page] ✅ Usuario ya autenticado, redirigiendo a /");
    redirect("/");
  }

  if (userId && isAddMode) {
    console.info("[login/page] ➕ Modo añadir cuenta, mostrando formulario");
  } else {
    console.info(
      "[login/page] ℹ️ Usuario no autenticado, mostrando formulario",
    );
  }

  return <ResponsiveLogin user={userId} />;
}
