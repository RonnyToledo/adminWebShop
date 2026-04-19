// lib/supabase.js
// ─── ÚNICO cliente browser para auth/UI. ──────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";

// Singleton: evita instanciar múltiples GoTrueClient en el browser (HMR safe)
let _browserClient = null;

/**
 * Devuelve el cliente Supabase para uso en Client Components y funciones cliente.
 * En server-side siempre retorna null — usa getServerSupabase() en su lugar.
 */
export function getSupabaseClient() {
  if (typeof window === "undefined") return null;
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return _browserClient;
}

// ─── authService ─────────────────────────────────────────────────────────────
// Todas las operaciones de auth van por la API Route (/api/login) para que
// las cookies de sesión se establezcan correctamente en el servidor.
export const authService = {
  /** Obtener usuario actual (server verifica la cookie) */
  async getCurrentUser() {
    try {
      const res = await fetch("/api/login", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /** Iniciar sesión */
  async signIn(email, password) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");
    return data;
  },

  /** Registrarse */
  async signUp(email, password, metadata = {}) {
    const res = await fetch("/api/login", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, metadata }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al registrarse");
    return data;
  },

  /** Cerrar sesión */
  async signOut() {
    const res = await fetch("/api/login", {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al cerrar sesión");
    return data;
  },

  /**
   * Suscribirse a cambios de sesión en el browser (login / logout / token refresh).
   * Retorna la función de unsubscribe para usar en useEffect cleanup.
   *
   * @example
   * useEffect(() => {
   *   return authService.onAuthStateChange((user) => setUser(user));
   * }, []);
   */
  onAuthStateChange(callback) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  },
};
