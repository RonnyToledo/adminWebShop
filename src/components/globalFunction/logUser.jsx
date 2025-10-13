// ============================================
// VERSIÓN MEJORADA DE LogUser
// Se integra con el nuevo código de la API
// ============================================

import { cookies } from "next/headers";
import { supabase } from "@/lib/supa";

// Constantes (deben coincidir con tu API)
const SESSION_COOKIE_NAME = "sb-access-token";

/**
 * Obtiene y valida la sesión del usuario desde la cookie
 * Similar a refreshAccessTokenIfNeeded pero más simple
 *
 * @returns {Object} { ok, status, message, user?, session? }
 */
export async function LogUser() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);

    // Validación: Cookie no existe
    if (!cookie) {
      return {
        ok: false,
        status: 401,
        message: "No hay sesión activa",
      };
    }

    // Validación: Cookie no puede ser parseada
    let parsedCookie;
    try {
      parsedCookie = JSON.parse(cookie.value);
    } catch (e) {
      console.error("Error al parsear cookie:", e);
      return {
        ok: false,
        status: 400,
        message: "Cookie de sesión inválida",
      };
    }

    // Validación: Cookie no tiene los tokens necesarios
    const { access_token, refresh_token } = parsedCookie;
    if (!access_token || !refresh_token) {
      return {
        ok: false,
        status: 401,
        message: "Tokens no encontrados en la cookie",
      };
    }

    // Intentar verificar el usuario con el access_token actual
    const { data: userData, error: userError } = await supabase.auth.getUser(
      access_token
    );

    // Si el token es válido, retornar inmediatamente
    if (!userError && userData?.user) {
      return {
        ok: true,
        status: 200,
        message: "Sesión válida",
        user: userData.user,
        session: {
          access_token,
          refresh_token,
          user: userData.user,
        },
      };
    }

    // Si el token expiró, intentar renovar con refresh_token
    console.info("Access token expirado, intentando renovar...");

    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token,
      });

    if (refreshError || !refreshData.session) {
      console.error("Error al renovar sesión:", refreshError);
      return {
        ok: false,
        status: 401,
        message: "Sesión expirada, por favor inicie sesión nuevamente",
        detail: refreshError?.message,
        needsReauth: true, // Flag para que el cliente sepa que debe redirigir
      };
    }

    // Sesión renovada exitosamente
    console.info("Sesión renovada exitosamente");

    // Actualizar la cookie con los nuevos tokens
    const newCookieValue = JSON.stringify({
      access_token: refreshData.session.access_token,
      refresh_token: refreshData.session.refresh_token,
    });

    cookieStore.set(SESSION_COOKIE_NAME, newCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
      sameSite: "lax",
    });

    return {
      ok: true,
      status: 200,
      message: "Sesión renovada",
      user: refreshData.user,
      session: refreshData.session,
      wasRefreshed: true, // Flag para saber que se renovó
    };
  } catch (error) {
    console.error("Error inesperado en LogUser:", error);
    return {
      ok: false,
      status: 500,
      message: "Error al procesar la sesión",
      detail: error.message,
    };
  }
}
