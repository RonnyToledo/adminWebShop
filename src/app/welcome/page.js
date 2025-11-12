import React from "react";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";
import { redirect } from "next/navigation";
import { initializeData, checkUser } from "../layout";

export default async function page() {
  const { userId, user } = await checkUser();
  if (userId) {
    console.info("Usuario recibido:", userId);
  } else {
    console.warn("No hay usuario, redirigiendo a login");
  }
  const data = await initializeData(userId);
  console.log(data, user);
  if (data?.user?.role == "manager" && data?.user?.login) {
    redirect("/");
  }
  const country = await fetch(
    `${process.env.NEXT_PUBLIC_PATH}/api/filter/country`
  );
  const res = await country.json();
  return <CrearClienteComponent user={user} countries={res} />;
}
