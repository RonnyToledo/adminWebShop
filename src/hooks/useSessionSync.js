"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Hook para sincronizar estado de sesión periódicamente
 * Valida cada 5 minutos si las cookies son aún válidas
 * Si no son válidas, las limpia proactivamente
 *
 * Uso:
 * ```javascript
 * export default function MyComponent() {
 *   useSessionSync();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useSessionSync(options = {}) {
  const {
    interval = 5 * 60 * 1000, // 5 minutos
    onSessionInvalid = null,
  } = options;

  const intervalRef = useRef(null);
  const lastCheckRef = useRef(0);

  const validateSession = useCallback(async () => {
    const now = Date.now();

    // Evitar múltiples validaciones simultáneas
    if (now - lastCheckRef.current < 1000) {
      return;
    }

    lastCheckRef.current = now;

    try {
      const response = await fetch("/api/login", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        // 401 = No autenticado o cookies inválidas
        if (response.status === 401) {
          console.warn(
            "[useSessionSync] Sesión inválida detectada, limpiando cookies...",
          );

          // Limpiar cookies manualmente en el cliente
          document.cookie = "sb-access-token=; path=/; max-age=0";
          document.cookie = "sb-refresh-token=; path=/; max-age=0";

          // Callback opcional para notificar a la aplicación
          if (onSessionInvalid) {
            onSessionInvalid();
          }

          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("[useSessionSync] Error validando sesión:", error);
      return false;
    }
  }, [onSessionInvalid]);

  useEffect(() => {
    // Validación inicial
    validateSession();

    // Configurar validación periódica
    intervalRef.current = setInterval(() => {
      validateSession();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, validateSession]);

  // Expone función para validación manual
  return { validateSession };
}

/**
 * Hook para escuchar cambios de visibilidad de la página
 * Valida sesión cuando el usuario vuelve a la página
 */
export function useSessionSyncOnVisibility() {
  const { validateSession } = useSessionSync({
    interval: 60 * 60 * 1000, // 1 hora (menos frecuente)
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Usuario regresó a la página
        console.log(
          "[useSessionSyncOnVisibility] Página visible, validando sesión...",
        );
        validateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [validateSession]);
}

/**
 * Hook para limpiar cookies cuando el usuario se desconecta
 */
export function useSessionCleanup() {
  const clearSessionCookies = useCallback(() => {
    // Limpiar todas las cookies de sesión de Supabase
    document.cookie = "sb-access-token=; path=/; max-age=0";
    document.cookie = "sb-refresh-token=; path=/; max-age=0";

    // Limpiar localStorage si se usa para state
    try {
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
    } catch (e) {
      // localStorage puede no estar disponible
    }

    console.log("[useSessionCleanup] Cookies de sesión limpiadas");
  }, []);

  return { clearSessionCookies };
}

/**
 * Hook completo que maneja sincronización + visibilidad + limpieza
 */
export function useComprehensiveSessionSync(options = {}) {
  const { onSessionInvalid } = options;

  const sessionSync = useSessionSync({
    onSessionInvalid,
  });

  const sessionCleanup = useSessionCleanup();

  useSessionSyncOnVisibility();

  return {
    validateSession: sessionSync.validateSession,
    clearSessionCookies: sessionCleanup.clearSessionCookies,
  };
}
