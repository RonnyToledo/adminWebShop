import React from "react";
import PlanesPage from "@/components/Chadcn-components/Planes/PlanesPage";
import { fetchPlanData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchPlanData(user.userId)
    : { data: null };

  if (result.error) {
    console.error("Error cargando los datos del plan:", result.error);
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <h1 className="font-medium">No se pudo cargar tu plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.error.message}
          </p>
          <a
            href="/planes"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Reintentar
          </a>
        </div>
      </main>
    );
  }

  if (!result.data?.store) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p role="status" className="text-sm text-muted-foreground">
          No encontramos una tienda vinculada a esta cuenta.
        </p>
      </main>
    );
  }

  return <PlanesPage initialData={result.data} />;
}
