"use client";
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { deleteNotification } from "@/lib/supabaseApi";
import HeaderAdmin from "@/components/Chadcn-components/General/HeaderAdmin";
import AppSidebar from "@/components/Chadcn-components/General/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { sileo } from "sileo";

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
  console.log(data || initialState);
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

    // Cuando no hay sesión:
    if (!user && !isProtectedRoute) {
      sessionStorage.setItem("pathRedirect", pathname); // ✅ persiste entre navegaciones
      router.refresh();
      return;
    }

    // Nuevo manager: redirigir a bienvenida
    if (data?.user?.role === "user") {
      console.info("Nuevo Manager, redirigiendo a crear catálogo");
      router.push("/welcome");
      return;
    }

    // Usuario válido: establecer datos SOLO en la primera carga
    // Cuando el usuario se loguea exitosamente:
    if (user && data && !isInitialized.current) {
      setWebshop((prev) => ({ ...prev, ...data })); // ✅ functional update
      isInitialized.current = true;

      const redirect = sessionStorage.getItem("pathRedirect");
      if (redirect) {
        sessionStorage.removeItem("pathRedirect");
        router.push(redirect);
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
