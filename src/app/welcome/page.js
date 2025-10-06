import React from "react";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeData } from "../layout";

export default async function page() {
  const userSession = await fetchUserSessionServer();
  const user = userSession?.user?.user?.id;
  if (user) console.info("Usuario recivido");
  const data = await initializeData(userSession?.user?.user?.id);

  if (data?.user?.role == "manager" && data?.user?.login) {
    redirect("/");
  }
  const country = await fetch(
    `${process.env.NEXT_PUBLIC_PATH}/api/filter/country`
  );
  const res = await country.json();
  return <CrearClienteComponent user={userSession} countries={res} />;
}

async function fetchUserSessionServer() {
  const cookieStore = await cookies(); // Obtiene las cookies en el servidor
  const sessionCookie = cookieStore.get("sb-access-token");
  if (!sessionCookie) {
    console.warn("No hay cookie de sesión disponible en el servidor.");
    return null;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
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
