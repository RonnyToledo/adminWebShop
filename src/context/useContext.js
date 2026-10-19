"use client";

import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import HeaderAdmin from "@/components/Chadcn-components/General/HeaderAdmin";
import AppSidebar from "@/components/Chadcn-components/General/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { authService } from "@/lib/supabase";
import { supabase } from "@/lib/supa";
import { useSessionSyncOnVisibility } from "@/hooks/useSessionSync";

export const ThemeContext = createContext();

const initialState = {
  store: {
    moneda: [],
    moneda_default: [],
    horarios: [],
    comentario: [],
    categorias: [],
    envios: [],
  },
  products: [],
  code: [],
  events: [],
  ga: {
    filterDatesInLast30Days: [],
    filterDatesInLast7Days: [],
    contarVisitasPorHora: [],
  },
  store_role: null,
};

const PROTECTED_ROUTES = [
  "/conditions-of-service",
  "/team-of-service",
  "/welcome",
];

const PUBLIC_ROUTES = [
  "/configPage",
  "/login",
  "/forgotPassword",
  "/resetPassword",
  "/auth/callback",
  "/createAccount",
  "/updatePassword",
];

function buildWebshopState(previous, data) {
  if (!data || Object.keys(data).length === 0) return previous ?? initialState;
  return {
    ...previous, // ← parte de lo que ya había, no de initialState
    ...data,
    store: { ...previous?.store, ...(data.store || {}) },
    ga: data.ga ? { ...previous?.ga, ...data.ga } : previous?.ga,
    store_role: data.store_role ?? previous?.store_role ?? null,
  };
}
// ─────────────────────────────────────────────────────────────────────────────
// isAddMode: viene del layout y señala que el usuario quiere añadir una segunda
// cuenta mientras ya tiene sesión activa. En ese caso NO redirigimos a "/" aunque
// haya user, y dejamos que /login muestre el formulario normalmente.
// ─────────────────────────────────────────────────────────────────────────────
export default function MyProvider({
  children,
  user,
  data,
  sessionError,
  isAddMode = false,
}) {
  const [webshop, setWebshop] = useState(() => buildWebshopState(data));
  const [OpenSidebar, setOpenSidebar] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isInitialized = useRef(false);
  const isLogin = useRef(false);
  const previousPathname = useRef(pathname);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
  const accessResolved =
    data != null &&
    data.store_access_resolved !== false &&
    Object.prototype.hasOwnProperty.call(data, "store_role");
  const hasStoreAccess = Boolean(data?.store_role);
  const isWelcomeRoute = pathname === "/welcome";

  const handleSessionInvalid = useCallback(() => {
    if (isPublicRoute) return;

    sessionStorage.setItem("pathRedirect", pathname);
    window.location.replace("/login");
  }, [isPublicRoute, pathname]);

  useSessionSyncOnVisibility({ onSessionInvalid: handleSessionInvalid });

  // ── Manejo de errores de sesión server-side ───────────────────────────────
  useEffect(() => {
    if (sessionError) {
      const isTimeoutError = sessionError === "TIMEOUT";
      const isCriticalError =
        sessionError === "INVALID_JWT" ||
        sessionError === "JWT_ERROR" ||
        sessionError === "NO_USER" ||
        sessionError === "PARSE_ERROR";

      if (isCriticalError) {
        if (!PUBLIC_ROUTES.includes(pathname)) {
          sessionStorage.setItem("pathRedirect", pathname);
          router.replace("/login");
        }
      } else if (isTimeoutError) {
        console.warn(
          "[MyProvider] ⏱️ Timeout en sesión (no crítico) - continuando",
        );
      }
    }
  }, [sessionError, pathname, router]);

  // ── Guard principal de rutas ──────────────────────────────────────────────
  const handleUserValidation = useCallback(async () => {
    // ── NUEVO: si estamos en modo "añadir cuenta", dejar pasar siempre,
    // incluso si hay un user activo. El formulario de login mostrará
    // el flujo para registrar la segunda cuenta.
    if (isAddMode && isPublicRoute) return;

    // Rutas públicas sin sesión: dejar pasar
    if (isPublicRoute && !isLogin.current) return;

    // Sin usuario autenticado
    if (!user) {
      const hasCookies =
        typeof document !== "undefined" &&
        document.cookie.includes("sb-access-token");

      if (hasCookies && sessionError === "TIMEOUT") return;

      if (isPublicRoute) return;

      sessionStorage.setItem("pathRedirect", pathname);

      router.replace("/login");
      return;
    }

    // Estas rutas solo requieren sesión; no requieren pertenecer a una tienda.
    if (isProtectedRoute && !isWelcomeRoute) return;

    // Una consulta de tienda fallida no significa que el usuario no tenga tienda.
    // Esperar evita enviarlo erróneamente al onboarding.
    if (!isWelcomeRoute && !accessResolved) return;

    // Usuario con acceso a tienda
    if (hasStoreAccess) {
      if (isWelcomeRoute) {
        router.replace("/");
        return;
      }

      if (user && data && !isInitialized.current) {
        setWebshop(buildWebshopState(data));
        isInitialized.current = true;

        const redirectTo = sessionStorage.getItem("pathRedirect");
        if (redirectTo) {
          sessionStorage.removeItem("pathRedirect");
          router.replace(redirectTo);
        }
      }
      return;
    }

    // Usuario sin membresía → onboarding /welcome
    if (!hasStoreAccess) {
      if (!isWelcomeRoute) {
        router.replace("/welcome");
      }

      if (user && data && !isInitialized.current) {
        setWebshop(buildWebshopState(data));
        isInitialized.current = true;
      }
      return;
    }
  }, [
    user,
    data,
    pathname,
    isPublicRoute,
    isProtectedRoute,
    accessResolved,
    isWelcomeRoute,
    hasStoreAccess,
    sessionError,
    isAddMode, // ← nueva dependencia
    router,
  ]);

  useEffect(() => {
    if (user) isLogin.current = true;
    handleUserValidation();
  }, [handleUserValidation, user]);

  useEffect(() => {
    if (!user) {
      isInitialized.current = false;
      isLogin.current = false;
      setWebshop(initialState);
      return;
    }
    setWebshop((prev) => buildWebshopState(prev, data));
    isInitialized.current = true;
  }, [user, data]);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser, event) => {
      // INITIAL_SESSION puede llegar como null antes de que el cliente
      // termine de leer las cookies que el servidor acaba de establecer.
      if (event === "INITIAL_SESSION") return;

      if (!authUser && user && event === "SIGNED_OUT") {
        isInitialized.current = false;
        isLogin.current = false;
        setWebshop(initialState);

        if (!PUBLIC_ROUTES.includes(pathname)) {
          sessionStorage.setItem("pathRedirect", pathname);
          router.replace("/login");
        }
      }
    });
    return unsubscribe;
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`realtime-user-${user}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_members",
          filter: `user_id=eq.${user}`,
        },
        (payload) => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user",
          filter: `id=eq.${user}`,
        },
        (payload) => {
          router.refresh();
        },
      )
      .subscribe((status, err) => {
        console.info("Realtime status:", status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, router]);
  return (
    <ThemeContext.Provider value={{ webshop, setWebshop }}>
      <Toaster position="top-center" />
      <SidebarProvider>
        {!isPublicRoute && !isProtectedRoute && (
          <AppSidebar
            ThemeContext={ThemeContext}
            isOpen={OpenSidebar}
            onClose={() => setOpenSidebar(false)}
          />
        )}
        <div className="w-full min-w-0">
          {!isPublicRoute && !isProtectedRoute && (
            <HeaderAdmin
              ThemeContext={ThemeContext}
              onMenuClick={() => setOpenSidebar(!OpenSidebar)}
            />
          )}
          {children}
        </div>
      </SidebarProvider>
    </ThemeContext.Provider>
  );
}
