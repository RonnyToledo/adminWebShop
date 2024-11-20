"use client";
import { useState, useEffect, createContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supa";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import styles from "./Sonner.module.css";
import { fetchStoreData, deleteNotification } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";

export const ThemeContext = createContext();

export default function AdminLayout({ children }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [user, setUser] = useState(null);
  const [webshop, setWebshop] = useState({
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
    ga: {},
  });
  const [storeDataReady, setStoreDataReady] = useState(false); // Nuevo estado para indicar que los datos están listos
  const router = useRouter();

  // Primer useEffect: Inicializar datos y cargar tienda
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userSession = await fetchUserSession();

        if (!userSession?.user?.id) {
          router.push("/");
          return;
        }

        const userId = userSession.user.id;

        // Fetch and handle pending notifications
        const { data: notifications } = await supabase
          .from("Notification")
          .select("*")
          .eq("userID", userId);

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

        // Fetch store data
        const { data: store, error } = await fetchStoreData(userId);
        if (error) throw error;

        if (!store?.login) {
          router.replace("configPage");
          return;
        }

        if (!store?.Sitios?.sitioweb) {
          router.replace("welcome");
          return;
        }

        const tiendaParsed = {
          ...store.Sitios,
          moneda: JSON.parse(store.Sitios.moneda),
          moneda_default: JSON.parse(store.Sitios.moneda_default),
          horario: JSON.parse(store.Sitios.horario),
          categoria: JSON.parse(store.Sitios.categoria),
          envios: JSON.parse(store.Sitios.envios),
        };

        const eventsParsed = store.Sitios.Events.map((event) => ({
          ...event,
          desc: JSON.parse(event.desc),
        }));

        const productosParsed = OrderProducts(
          store.Sitios.Products,
          tiendaParsed.categoria
        );
        delete tiendaParsed.Products;
        setWebshop((prev) => ({
          ...prev,
          store: tiendaParsed,
          products: productosParsed,
          events: eventsParsed,
          code: tiendaParsed.codeDiscount,
        }));
        setUser(userSession.user);
        setStoreDataReady(true); // Marcar que los datos iniciales están listos
      } catch (error) {
        console.error("Error inicializando datos:", error);
      }
    };

    initializeData();
  }, [router]);

  // Segundo useEffect: Llamada a la API de Google Analytics
  useEffect(() => {
    const fetchGAData = async () => {
      try {
        if (!webshop.store?.sitioweb) return;
        console.log(webshop.store?.sitioweb);
        const response = await fetch(
          `/api/tienda/${webshop.store.sitioweb}/GA`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const gaData = await response.json();
        console.log(gaData);
        setWebshop((prev) => ({
          ...prev,
          ga: gaData,
          products: prev.products.map((obj) => ({
            ...obj,
            visitas: gaData.visitasProductos[obj.productId] || 0,
          })),
        }));
      } catch (error) {
        console.error("Error obteniendo datos de GA:", error);
      }
    };

    if (storeDataReady) {
      fetchGAData(); // Ejecutar cuando los datos iniciales estén listos
    }
  }, [storeDataReady, webshop.store?.sitioweb]);

  useEffect(() => {
    if (!user) return;

    const handleNotification = async (payload) => {
      const notification = payload.new;
      if (notification.userID === user.id) {
        await deleteNotification(notification.id);
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
      <main className="sm:pl-14">{children}</main>
      <SonnerToaster className={styles.sonner_dark} />
      <UiToaster />
    </ThemeContext.Provider>
  );
}

// Auxiliar para obtener sesión de usuario
async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data;
    } else {
      console.log("Usuario no encontrado o error en la respuesta:", data);
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}
