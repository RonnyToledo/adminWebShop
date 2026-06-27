import React from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/server-auth";
import { fetchStoreAccessData } from "@/lib/supabaseApi";
import { createServerSupabase } from "@/lib/supabase-server";
import WelcomeComponent from "@/components/Chadcn-components/Welcome/welcome-component";
import MembershipsComponent from "@/components/Chadcn-components/Welcome/memberships-component";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";

export default async function page() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const userData = await getServerUser();
  if (!userData?.userId) {
    redirect("/login");
  }

  const { data } = await fetchStoreAccessData(userData.userId);

  // Si es manager, redirigir al dashboard
  if (data?.user?.role === "manager") {
    redirect("/");
  }

  let country = [];
  const res = await fetch(`${base}/api/filter/country`);
  if (!res.ok) {
    setStates([]);
    return;
  }
  country = await res.json();
  if (data.user.owner_aproved == true)
    return (
      <CrearClienteComponent user={data?.user ?? null} countries={country} />
    );

  // Si tiene membresías activas, mostrar la interfaz de membresías
  if (data?.store_role) {
    // Obtener todas las membresías activas
    const supabase = await createServerSupabase();
    const { data: memberships } = await supabase
      .from("store_members")
      .select(
        `id, store_role, store_id, created_at, active,
         store:store_id(UUID, name)`,
      )
      .eq("user_id", userData.userId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    return (
      <MembershipsComponent
        user={data?.user ?? null}
        memberships={memberships ?? []}
      />
    );
  }

  // Mostrar bienvenida para usuarios sin tienda/team
  return <WelcomeComponent user={data?.user ?? null} />;
}
