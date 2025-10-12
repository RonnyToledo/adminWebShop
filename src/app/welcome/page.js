import React from "react";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initializeData } from "../layout";
import { fetchUserSessionServer } from "@/components/globalFunction/loginFunction";

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
