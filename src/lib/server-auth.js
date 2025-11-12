// lib/server-auth.js
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Servicio de autenticación para Server Components
export const serverAuthService = {
  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const cookieStore = await cookies();
      const supabase = createServerComponentClient({
        cookies: () => cookieStore,
      });

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        userId: user.id,
        email: user.email,
        user: user,
      };
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  },

  // Obtener sesión actual
  async getSession() {
    try {
      const cookieStore = cookies();
      const supabase = createServerComponentClient({
        cookies: () => cookieStore,
      });

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error obteniendo sesión:", error);
      return null;
    }
  },

  // Verificar si está autenticado
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  },

  // Crear cliente de Supabase
  createClient() {
    const cookieStore = cookies();
    return createServerComponentClient({ cookies: () => cookieStore });
  },
};

// Función helper para proteger páginas del servidor
export async function requireAuth() {
  const user = await serverAuthService.getCurrentUser();

  if (!user) {
    return {
      authenticated: false,
      user: null,
      redirect: "/login",
    };
  }

  return {
    authenticated: true,
    user,
    redirect: null,
  };
}
