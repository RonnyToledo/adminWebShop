// lib/supabase.js
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  return createClientComponentClient();
};

// Funciones helper para autenticación
export const authService = {
  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const response = await fetch("/api/login", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  },

  // Iniciar sesión
  async signIn(email, password) {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Registrarse
  async signUp(email, password, metadata = {}) {
    try {
      const response = await fetch("/api/login", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, metadata }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Cerrar sesión
  async signOut() {
    try {
      const response = await fetch("/api/login", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cerrar sesión");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};
