import React from "react";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";
import { redirect } from "next/navigation";
import { initializeData } from "../layout";
import { getServerUser } from "@/lib/server-auth";
import { supabase } from "@/lib/supa";

export default async function page() {
  const userData = await getServerUser();
  const { data: user } = await supabase
    .from("user")
    .select("*")
    .eq("id", userData?.userId)
    .single();
  if (userData?.userId) {
    console.info("Usuario recibido:", userData?.userId);
  } else {
    console.warn("No hay usuario, redirigiendo a login");
  }
  const data = await initializeData(userData?.userId);
  if (data?.user?.role == "manager" && data?.user?.login) {
    redirect("/");
  }
  console.log(`${process.env.NEXT_PUBLIC_PATH}/api/filter/country`);
  const country = await fetch(
    `${process.env.NEXT_PUBLIC_PATH}/api/filter/country`,
  );
  const res = await country.json();
  return <CrearClienteComponent user={user} countries={res} />;
}
