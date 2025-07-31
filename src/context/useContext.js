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
  "/welcome",
];
const routesAlternatives = ["/configPage", "/login", "/resetPassword"];

export default function MyProvider({ children, user, data }) {
  const [webshop, setWebshop] = useState(initialState);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if ((!user || user == undefined) && !routesOffLogin.includes(pathname)) {
      console.log("saltando desde Context");
      router.push("/login");
    }

    if (data?.user?.role == "manager" && data?.user?.login == false) {
      router.push("/welcome");
      setIsNewUser(true);
    } else {
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
        {!isNewUser &&
          !routesOffLogin.includes(pathname) &&
          !routesAlternatives.includes(pathname) && (
            <AppSidebar ThemeContext={ThemeContext} />
          )}
        <div className="w-full">
          {!isNewUser &&
            !routesOffLogin.includes(pathname) &&
            !routesAlternatives.includes(pathname) && (
              <HeaderAdmin ThemeContext={ThemeContext} />
            )}

          {children}
        </div>
      </SidebarProvider>
    </ThemeContext.Provider>
  );
}
function formatDate(date) {
  const d = new Date(date);
  const day = `${d.getDate()}`.padStart(2, "0"); // día con ceros delante
  const month = `${d.getMonth() + 1}`.padStart(2, "0"); // meses de 0–11, por eso +1
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
