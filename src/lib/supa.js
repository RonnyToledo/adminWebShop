// lib/supabaseClient.ts
import { createClient as create } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Esto ayuda en dev a detectar variables faltantes
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Evita crear múltiples instancias cuando Vite/Next.js re-hota en desarrollo (HMR)
// Usamos globalThis para almacenar el singleton en el entorno global.

// factory para crear una nueva instancia
function makeClient() {
  return create(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "sb-auth-token",
      flowType: "pkce",
    },
  });
}

/**
 * Singleton reutilizable en el browser.
 * - En client-side usaremos siempre esta instancia para evitar múltiples GoTrueClient.
 * - En server-side se puede crear un cliente temporal con `createClient()` abajo.
 */
export const supabase =
  typeof window !== "undefined"
    ? global.__supabase_singleton__ ??
      (global.__supabase_singleton__ = makeClient())
    : makeClient(); // SSR: crear uno nuevo (no persistente entre requests)

/**
 * createClient()
 * - Para compatibilidad con tu código previo que hacía `createClient()`.
 * - EN BROWSER: devuelve el singleton (evita crear otra instancia GoTrue).
 * - EN SERVER: crea y retorna una instancia nueva (segura para request/SSR).
 */
export const createClient = () => {
  if (typeof window !== "undefined") {
    // siempre devolver la instancia compartida en el cliente
    return supabase;
  }
  // en server, crear un cliente por petición (no persiste ni comparte listeners)
  return makeClient();
};
