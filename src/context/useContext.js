"use client";
import React, { createContext, useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supa";
import { fetchStoreData, deleteNotification } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";
import { subscribeUserToPush } from "@/lib/notificaciones";

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

export default function MyProvider({ children, user, data }) {
  const [webshop, setWebshop] = useState(initialState);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user || user == undefined) router.push("/");

    if (data?.user?.login == false) {
      router.push("/createAccount");
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
  }, [router]);

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
  }, [user]);

  return (
    <ThemeContext.Provider value={{ webshop, setWebshop }}>
      {!isNewUser && <HeaderAdmin ThemeContext={ThemeContext} />}

      {children}
    </ThemeContext.Provider>
  );
}
