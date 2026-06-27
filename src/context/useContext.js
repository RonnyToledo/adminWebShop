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
  "/resetPassword",
  "/createAccount",
  "/updatePassword",
];

function buildWebshopState(data) {
  if (!data || Object.keys(data).length === 0) return initialState;
  return {
    ...initialState,
    ...data,
    store: { ...initialState.store, ...(data.store || {}) },
    ga: { ...initialState.ga, ...(data.ga || {}) },
    store_role: data.store_role ?? null,
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

  const hasStoreAccess = Boolean(data?.store_role);
  const isWelcomeRoute = pathname === "/welcome";

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

      if (!isPublicRoute || !isProtectedRoute)
        sessionStorage.setItem("pathRedirect", pathname);

      router.replace("/login");
      return;
    }

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
    setWebshop(buildWebshopState(data));
    isInitialized.current = true;
  }, [user, data]);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      if (!authUser && user) {
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
        <div className="w-full">
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
