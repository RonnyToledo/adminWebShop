import React from "react";
import { ResponsiveLogin } from "@/components/responsive-login";
import { cookies } from "next/headers";

export default async function usePage() {
  const userSession = await fetchUserSessionServer();
  const user = userSession?.user?.user?.id;
  return <ResponsiveLogin user={user} />;
}

async function fetchUserSessionServer() {
  const cookieStore = await cookies(); // Obtiene las cookies en el servidor
  const sessionCookie = cookieStore.get("sb-access-token");
  if (!sessionCookie) {
    console.warn("No hay cookie de sesión disponible en el servidor.");
    return null;
  }

  try {
    const res = await fetch(`/api/login`, {
      method: "GET",
      headers: {
        Cookie: `sb-access-token=${sessionCookie.value}`, // Agrega la cookie manualmente
      },
    });
    if (!res.ok) {
      console.error("Error en la respuesta del servidor:", res.statusText);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error al obtener la sesión en el servidor:", error);
    return null;
  }
}
