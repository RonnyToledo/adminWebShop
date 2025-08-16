"use client";
import React, { createContext, useEffect, useReducer, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { deleteNotification } from "@/lib/supabaseApi";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";
import AppSidebar from "@/components/Chadcn-components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/components/ui/use-toast";

export const ThemeContext = createContext();

const initialState = {
  store: {
    moneda: [],
    moneda_default: [],
    horario: [],
    comentario: [],
    categoria: [],
    envios: [],
    edit: { grid: 2, square: false, horizontal: false, minimalista: false },
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

const routesOffLogin = [
  "/conditions-of-service",
  "/team-of-service",
  "/createAccount",
  "/updatePassword",
  "/updatePassword/updatePassword",
  "/welcome",
];
const routesAlternatives = ["/configPage", "/login", "/resetPassword"];

export default function MyProvider({ children, user, data }) {
  const [webshop, setWebshop] = useState(initialState);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [routesAlternativesState, setRoutesAlternativesState] = useState(false);
  const [routesOffLoginState, setRoutesOffLoginState] = useState(false);

  useEffect(() => {
    setRoutesAlternativesState(routesAlternatives.includes(pathname));
    setRoutesOffLoginState(routesOffLogin.includes(pathname));
  }, [pathname]);

  useEffect(() => {
    if ((!user || user == undefined) && !routesOffLoginState) {
      console.info(
        "No existe session, redirijiendo a pagina de Inicio de Session"
      );
      router.push(`/login`);
    } else if (data?.user?.role == "user") {
      console.error("Usuario denegado");
      try {
        const res = fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
          method: "DELETE",
        });

        if (res.ok) {
          router.push("/login");
        } else {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Error Cerrando Sesion",
          });
        }
      } catch (error) {
        console.error("Error en la respuesta:", error);
        toast({
          title: "Error",
          variant: "destructive",
          description: `error: ${error.message}`,
        });
      }
    } else if (data?.user?.role == "manager" && data?.user?.login == false) {
      console.info("Nuevo Manager, redirijiendo a crear catalogo");

      router.push("/welcome");
    } else {
      /* router.push("/");*/

      console.info("Bienvenido");
      setWebshop(data);
    }
  }, [data, user]);

  // Primer useEffect: Inicializar datos y cargar tienda
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch and handle pending notifications
        const { data: notifications } = await supabase
          .from("Notification")
          .select("*")
          .eq("userID", user);
        if (notifications?.length) {
          const toastPromises = notifications.map(async (notification) => {
            toast("Notificación", {
              description: notification.mensaje,
              action: { label: "Cerrar" },
            });
            await deleteNotification(notification.id);
          });
          await Promise.all(toastPromises);
        }
      } catch (error) {
        console.error("Error inicializando datos:", error);
      }
    };
    initializeData();
  }, [router, user, toast]);

  useEffect(() => {
    if (!user) return;

    const handleNotification = async (payload) => {
      const notification = payload.new;
      if (notification.userID === user.id) {
        await deleteNotification(notification.id);
        await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Nueva Notificacion",
            message: notification.mensaje,
          }),
        });
        toast("Notificación", {
          description: notification.mensaje,
          action: { label: "Cerrar" },
        });
      }
    };

    const channel = supabase
      .channel("custom-insert-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification" },
        handleNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return (
    <ThemeContext.Provider value={{ webshop, setWebshop }}>
      <SidebarProvider>
        {!routesAlternativesState && !routesOffLoginState && (
          <AppSidebar ThemeContext={ThemeContext} />
        )}
        <div className="w-full">
          {!routesAlternativesState && !routesOffLoginState && (
            <HeaderAdmin ThemeContext={ThemeContext} />
          )}

          {children}
        </div>
      </SidebarProvider>
    </ThemeContext.Provider>
  );
}
