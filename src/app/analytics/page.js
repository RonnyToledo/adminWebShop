import React from "react";
import Logins from "@/components/Chadcn-components/Analytics/Logins";
import { ThemeContext } from "@/context/useContext";
import { fetchAnalyticsData } from "@/lib/supabaseApi";
import { getServerUser } from "@/lib/server-auth";

export default async function Page() {
  const user = await getServerUser();
  const result = user?.userId
    ? await fetchAnalyticsData(user.userId)
    : { data: null };

  if (result.error) {
    console.error("Error cargando analíticas:", result.error);
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <h1 className="font-medium">No se pudieron cargar las analíticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.error.message}
          </p>
          <a
            href="/analytics"
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
      <main className="mx-auto max-w-4xl p-6">
        <p role="status" className="text-sm text-muted-foreground">
          No encontramos una tienda vinculada a esta cuenta.
        </p>
      </main>
    );
  }

  return (
    <div>
      <Logins ThemeContext={ThemeContext} initialData={result.data} />
    </div>
  );
}
