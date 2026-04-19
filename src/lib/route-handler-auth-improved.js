// Mejora para route-handler-auth.js
// Agrrega reintentos y mejor manejo de errores

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are not configured.");
  }
}

export async function createRouteSupabase() {
  assertEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Obtiene usuario con reintentos en caso de error de sesión
 * @param {number} maxRetries - Número máximo de reintentos
 */
export async function getRouteUser(maxRetries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const supabase = await createRouteSupabase();
      
      // Timeout de 5 segundos para getUser
      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getUser timeout")), 5000)
        ),
      ]);

      return {
        supabase,
        user: error ? null : user,
        error,
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Esperar antes de reintentar
        const delay = Math.pow(2, attempt - 1) * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    supabase: null,
    user: null,
    error: lastError,
  };
}

/**
 * Requiere autenticación con mejor manejo de errores
 */
export async function requireRouteUser() {
  const { supabase, user, error } = await getRouteUser();

  if (error || !user) {
    const errorMessage = error?.message || "Usuario no autenticado";
    throw new Error(errorMessage);
  }

  return { supabase, user };
}
