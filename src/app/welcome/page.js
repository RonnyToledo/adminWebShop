import React from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/server-auth";
import { fetchStoreAccessData } from "@/lib/supabaseApi";
import { createServerSupabase } from "@/lib/supabase-server";
import WelcomeComponent from "@/components/Chadcn-components/Welcome/welcome-component";
import MembershipsComponent from "@/components/Chadcn-components/Welcome/memberships-component";
import { CrearClienteComponent } from "@/components/Chadcn-components/Welcome/crear-cliente";

const isValidPlanId = (value) => /^[a-z0-9_-]{1,40}$/i.test(value || "");

export default async function page({ searchParams }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const params = await searchParams;
  const userData = await getServerUser();
  if (!userData?.userId) {
    redirect("/login");
  }

  const { data } = await fetchStoreAccessData(userData.userId);
  const queryPlan = params?.plan;
  const savedPlan = userData.user?.user_metadata?.requested_plan;
  const requestedPlan = isValidPlanId(savedPlan)
    ? savedPlan
    : isValidPlanId(queryPlan)
      ? queryPlan
      : null;

  // Los usuarios con el onboarding completado vuelven al dashboard.
  if (
    data?.store_role &&
    data?.user?.role &&
    data.user.role !== "user"
  ) {
    redirect("/");
  }

  if (data?.user?.owner_aproved === true) {
    let countries = [];
    try {
      const res = await fetch(`${base}/api/filter/country`);
      if (!res.ok) {
        throw new Error(`Error cargando países: HTTP ${res.status}`);
      }
      countries = await res.json();
      if (!Array.isArray(countries)) {
        throw new Error("La respuesta de países no tiene el formato esperado");
      }
    } catch (error) {
      console.error("[welcome] No se pudieron cargar los países:", error);
    }

    return (
      <CrearClienteComponent
        user={data?.user ?? null}
        countries={countries}
        requestedPlan={requestedPlan}
        planSaveError={params?.plan_save_error === "1"}
      />
    );
  }

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
  return (
    <WelcomeComponent
      user={data?.user ?? null}
      requestedPlan={requestedPlan}
      planSaveError={params?.plan_save_error === "1"}
    />
  );
}
