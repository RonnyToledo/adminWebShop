"use client";
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { deleteNotification } from "@/lib/supabaseApi";
import HeaderAdmin from "@/components/Chadcn-components/General/HeaderAdmin";
import AppSidebar from "@/components/Chadcn-components/General/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { sileo } from "sileo";

import { authService } from "@/lib/supabase";

export const ThemeContext = createContext();

const initialState = {
  store: {
    moneda: [],
    moneda_default: [],
    horario: [],
    comentario: [],
    categoria: [],
    envios: [],
    edit: { grid: true, square: false, horizontal: false, minimalista: false },
  },
  products: [],
  code: [],
  events: [],
  ga: {
    filterDatesInLast30Days: [],
    filterDatesInLast7Days: [],
    contarVisitasPorHora: [],
  },
};

const PROTECTED_ROUTES = [
  "/conditions-of-service",
  "/team-of-service",
  "/createAccount",
  "/updatePassword",
  "/welcome",
];
const PUBLIC_ROUTES = ["/configPage", "/login", "/resetPassword"];

export default function MyProvider({ children, user, data }) {
  const [webshop, setWebshop] = useState(data || initialState);
  const [OpenSidebar, setOpenSidebar] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // Refs para controlar la inicialización
  const isInitialized = useRef(false);
  const isLogin = useRef(false);
  const previousPathname = useRef(pathname);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);

  // Ejecutar validación solo en mount y cuando cambia el usuario
  useEffect(() => {
    if (user) {
      isLogin.current = true;
    }
    handleUserValidation();
  }, [user]); // SOLO depende de 'user', no de 'data' ni 'pathname'

  // Manejo de redirecciones y validaciones
  const handleUserValidation = useCallback(async () => {
    // Si es ruta pública, permitir
    if (isPublicRoute && !isLogin.current) {
      console.info("Ruta protegida");
      return;
    }

    // Si no hay usuario y no es ruta protegida
    if (!user && !isProtectedRoute) {
      console.info("No existe sesión, redirigiendo a login");
      setWebshop((prev) => ({ ...prev, pathRedirect: pathname }));
      router.push("/login");
      return;
    }

    // Usuario con rol "user" no puede acceder
    if (data?.user?.role === "user") {
      console.error("Usuario denegado");
      try {
        await authService.signOut();
        router.push("/login");
      } catch (error) {
        console.error("Error cerrando sesión:", error);
        sileo.info({
          title: "Error",
          variant: "destructive",
          description: "Error cerrando sesión",
        });
      }
      return;
    }

    // Nuevo manager: redirigir a bienvenida
    if (data?.user?.role === "manager" && data?.user?.login === false) {
      console.info("Nuevo Manager, redirigiendo a crear catálogo");
      router.push("/welcome");
      return;
    }

    // Usuario válido: establecer datos SOLO en la primera carga
    if (user && data && !isInitialized.current) {
      console.info("Inicializando datos del usuario");
      setWebshop(data);
      isInitialized.current = true;

      if (data.pathRedirect) {
        router.push(data.pathRedirect);
        setWebshop((prev) => ({ ...prev, pathRedirect: null }));
      }
    }
  }, [user, data, pathname, isPublicRoute, isProtectedRoute, router]);

  // Detectar cambios de ruta para logs (opcional)
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      console.info("Navegación:", previousPathname.current, "→", pathname);
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <ThemeContext.Provider value={{ webshop, setWebshop }}>
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
