// ============================================
// CLIENTE (Client Component)
// ============================================

/**
 * Función para cerrar sesión desde el cliente
 * @param {Function} router - Router de Next.js para redirección
 */
export const logOut = async (router) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
      method: "DELETE",
      credentials: "include", // CRÍTICO: Incluye cookies automáticamente
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error al cerrar sesión:", data.error);
      // Incluso si hay error, redirigir al login por seguridad
      router.push("/login");
      return { success: false, error: data.error };
    }

    // Sesión cerrada exitosamente
    console.info("Sesión cerrada correctamente");
    router.push("/login");
    return { success: true };
  } catch (error) {
    console.error("Error de red al cerrar sesión:", error);
    // Redirigir al login de todas formas
    router.push("/login");
    return { success: false, error: "Error de conexión" };
  }
};

/**
 * Función para obtener la sesión actual desde el cliente
 * @returns {Object|null} Datos del usuario o null si no hay sesión
 */
export const fetchUserSession = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
      method: "GET",
      credentials: "include", // CRÍTICO: Incluye cookies automáticamente
      cache: "no-store", // Evita cache para tener sesión actualizada
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.info("No hay sesión activa");
        return null;
      }
      console.error("Error al obtener sesión:", res.statusText);
      return null;
    }

    const data = await res.json();
    return data.user || null;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    return null;
  }
};

/**
 * Función para iniciar sesión desde el cliente
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} Resultado de la autenticación
 */
export const logIn = async (email, password) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
      method: "POST",
      credentials: "include", // CRÍTICO: Incluye cookies automáticamente
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Error al iniciar sesión",
        status: res.status,
      };
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
    };
  } catch (error) {
    console.error("Error de red al iniciar sesión:", error);
    return {
      success: false,
      error: "Error de conexión. Intente nuevamente.",
    };
  }
};

/**
 * Función para registrar un nuevo usuario desde el cliente
 * @param {FormData} formData - Datos del formulario (email, name, password, image)
 * @returns {Object} Resultado del registro
 */
export const signUp = async (formData) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
      method: "PUT",
      credentials: "include",
      body: formData, // FormData se envía sin Content-Type header
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Error al crear cuenta",
        status: res.status,
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Error de red al registrar usuario:", error);
    return {
      success: false,
      error: "Error de conexión. Intente nuevamente.",
    };
  }
};

// ============================================
// SERVIDOR (Server Component)
// ============================================

/**
 * Función para obtener la sesión del usuario en el servidor
 * NO requiere hacer fetch - lee directamente la cookie
 * @returns {Object|null} Datos del usuario o null si no hay sesión
 */
export async function fetchUserSessionServer() {
  // Importa cookies dentro de la función para evitar problemas
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sb-access-token");

  if (!sessionCookie) {
    return null;
  }

  try {
    // Importa supabase dinámicamente
    const { supabase } = await import("@/lib/supa");

    const parsedCookie = JSON.parse(sessionCookie.value);
    const { access_token } = parsedCookie;

    // Verificar directamente con Supabase, sin hacer fetch interno
    const { data: user, error } = await supabase.auth.getUser(access_token);

    if (error) {
      console.error("Token inválido o expirado:", error.message);
      return null;
    }

    return user.user;
  } catch (error) {
    console.error("Error al parsear cookie de sesión:", error);
    return null;
  }
}

/**
 * Middleware para proteger rutas del lado del servidor
 * Uso: const user = await requireAuth();
 * @returns {Object} Usuario autenticado
 * @throws {Error} Si no hay sesión válida
 */
export async function requireAuth() {
  const user = await fetchUserSessionServer();

  if (!user) {
    throw new Error("Autenticación requerida");
  }

  return user;
}

// ============================================
// HOOK PERSONALIZADO PARA REACT (Opcional)
// ============================================

/**
 * Hook para gestionar la sesión en componentes de React
 * Uso en Client Components:
 *
 * const { user, loading, logOut, refreshSession } = useSession();
 */
export function useSession() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const refreshSession = React.useCallback(async () => {
    setLoading(true);
    const userData = await fetchUserSession();
    setUser(userData);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleLogOut = React.useCallback(async () => {
    await logOut(router);
    setUser(null);
  }, [router]);

  return {
    user,
    loading,
    logOut: handleLogOut,
    refreshSession,
    isAuthenticated: !!user,
  };
}

// ============================================
// EJEMPLO DE USO
// ============================================

/*
// En un Client Component:
"use client";

import { useRouter } from "next/navigation";
import { logIn, logOut, fetchUserSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await logIn(
      formData.get("email"),
      formData.get("password")
    );
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      alert(result.error);
    }
  };
  
  const handleLogOut = async () => {
    await logOut(router);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Iniciar Sesión</button>
      <button type="button" onClick={handleLogOut}>Cerrar Sesión</button>
    </form>
  );
}

// En un Server Component:
import { fetchUserSessionServer, requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  // Opción 1: Obtener usuario (puede ser null)
  const user = await fetchUserSessionServer();
  
  if (!user) {
    redirect("/login");
  }
  
  // Opción 2: Requiere autenticación (lanza error si no hay sesión)
  try {
    const user = await requireAuth();
    return <div>Bienvenido, {user.email}</div>;
  } catch (error) {
    redirect("/login");
  }
}

// Usando el hook useSession:
"use client";

import { useSession } from "@/lib/auth";

export default function Profile() {
  const { user, loading, logOut, isAuthenticated } = useSession();
  
  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <div>No autenticado</div>;
  
  return (
    <div>
      <h1>Hola, {user.email}</h1>
      <button onClick={logOut}>Cerrar Sesión</button>
    </div>
  );
}
*/
