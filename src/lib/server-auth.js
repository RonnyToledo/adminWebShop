// lib/server-auth.js
// ─── Autenticación para Server Components, layouts y Route Handlers ───────────
// NUNCA importar este archivo desde Client Components ("use client").

import { createServerSupabase } from "@/lib/supabase-server";

/**
 * Crea un cliente Supabase para Server Components.
 * Cada llamada crea una instancia nueva (correcto en SSR — no hay singleton aquí).
 */
async function createServerClient() {
  return createServerSupabase();
}

/**
 * Retorna el usuario autenticado o null, con diferenciación de tipos de error.
 * Usa getUser() (verifica el JWT contra Supabase) para mayor seguridad.
 *
 * @returns {{ userId: string, email: string, user: object, error: null } | { userId: null, user: null, error: string, errorType: string }}
 */
function isInvalidSessionError(error) {
  const code = error?.code?.toLowerCase?.() ?? "";
  const message = error?.message?.toLowerCase?.() ?? "";

  return (
    ["bad_jwt", "session_not_found", "refresh_token_not_found"].includes(
      code,
    ) ||
    message.includes("invalid jwt") ||
    message.includes("jwt expired") ||
    message.includes("session not found")
  );
}

function isTransientAuthError(error) {
  const message = error?.message?.toLowerCase?.() ?? "";

  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed")
  );
}

export async function getServerUser() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error,
    } = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("getUser timeout")), 8000),
      ),
    ]);

    if (error) {
      if (isInvalidSessionError(error)) {
        console.warn(
          "[getServerUser] ℹ️ Sesión inválida o expirada:",
          error.message,
        );
        return {
          userId: null,
          user: null,
          error: error.message,
          errorType: "NO_USER",
        };
      }

      if (isTransientAuthError(error)) {
        console.warn(`[getServerUser] ⚠️ Error temporal: ${error.message}`);
        return {
          userId: null,
          user: null,
          error: error.message,
          errorType: "TEMPORARY",
        };
      }

      let errorType = "UNKNOWN";
      if (error.message?.includes("invalid")) {
        errorType = "INVALID_JWT";
      } else if (error.message?.includes("jwt")) {
        errorType = "JWT_ERROR";
      } else if (error.message?.includes("unable to parse")) {
        errorType = "PARSE_ERROR";
      }

      console.warn(`[getServerUser] ⚠️ Error: ${errorType} - ${error.message}`);
      return { userId: null, user: null, error: error.message, errorType };
    }

    if (!user) {
      console.warn(
        "[getServerUser] ℹ️ No user found - session expired or invalid",
      );
      return {
        userId: null,
        user: null,
        error: "NO_USER",
        errorType: "NO_USER",
      };
    }

    console.info("[getServerUser] ✅ Usuario autenticado:", user.email);
    return {
      userId: user.id,
      email: user.email,
      user,
      error: null,
      errorType: null,
    };
  } catch (err) {
    const errorType = err.message?.includes("timeout")
      ? "TIMEOUT"
      : "EXCEPTION";
    console.error(
      `[getServerUser] ❌ Exception (${errorType}): ${err.message}`,
    );
    return { userId: null, user: null, error: err.message, errorType };
  }
}

/**
 * Retorna la sesión activa o null.
 * Útil cuando necesitas el access_token directamente.
 */
export async function getServerSession() {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session ?? null;
  } catch {
    return null;
  }
}

/**
 * Helper para layouts y pages protegidos.
 * @returns {{ authenticated: boolean, userId: string|null, user: object|null }}
 */
export async function requireAuth() {
  const userData = await getServerUser();
  if (!userData?.userId) {
    return { authenticated: false, userId: null, user: null };
  }
  return { authenticated: true, ...userData };
}

// ─── Alias de compatibilidad (para no romper imports existentes) ───────────────
// serverAuthService.getCurrentUser() → getServerUser()
export const serverAuthService = {
  getCurrentUser: getServerUser,
  getSession: getServerSession,
  isAuthenticated: async () => Boolean((await getServerUser())?.userId),
  createClient: createServerClient,
};
