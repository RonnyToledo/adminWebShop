"use client";
import styles from "./Sonner.module.css";
import { useState, useEffect, createContext } from "react";
import { supabase } from "@/lib/supa";
import { useRouter } from "next/navigation";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import useSWR from "swr";

export const ThemeContext = createContext();

async function fetchPendingNotifications(userId) {
  try {
    const { data: notifications } = await supabase
      .from("Notification")
      .select("*")
      .eq("userID", userId);

    return notifications || [];
  } catch (error) {
    console.error("Error al obtener notificaciones pendientes:", error);
    throw error;
  }
}
async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data;
    } else {
      console.log("Usuario no encontrado o error en la respuesta:", data);
      return;
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}

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
  const router = useRouter();

  console.log(webshop);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userId = await fetchUserSession();

        if (!userId?.user?.id) {
          router.push("/");
          return;
        }

        // Fetch and show pending notifications
        const pendingNotifications = await fetchPendingNotifications(
          userId.user.id
        );

        // Usamos un bucle for...of para poder utilizar await
        for (const notification of pendingNotifications) {
          toast("Notificación", {
            description: notification.mensaje,
            action: {
              label: "Cerrar",
            },
          });
          // Esperar a que la notificación se elimine antes de continuar
          await DeleteNotification(notification.id);
        }

        const { data: store, error: errorStore } = await supabase
          .from("Sitios")
          .select(
            "*, Products (*, agregados(*)), Events (*) , codeDiscount (*)"
          )
          .eq("Editor", userId.user.id)
          .single();

        if (!store?.sitioweb) {
          router.replace("welcome");
        } else if (!store?.active) {
          router.replace("configPage");
        } else {
          const tiendaParsed = {
            ...store,
            moneda: JSON.parse(store.moneda),
            moneda_default: JSON.parse(store.moneda_default),
            horario: JSON.parse(store.horario),
            comentario: JSON.parse(store.comentario),
            categoria: JSON.parse(store.categoria),
            envios: JSON.parse(store.envios),
          };
          const productosParsed = OrderProducts(
            store.Products,
            tiendaParsed.categoria
          );
          const eventsParsed = store.Events.map((event) => ({
            ...event,
            desc: JSON.parse(event.desc),
          }));
          const response = await fetch(`/api/tienda/${store.sitioweb}/GA`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setWebshop({
            store: tiendaParsed,
            products: productosParsed,
            events: eventsParsed,
            code: tiendaParsed.codeDiscount,
            ga: data,
          });
          setUser(userId);
        }
      } catch (error) {
        console.error("Error inicializando datos:", error);
        return {}; // Retorna un valor por defecto en caso de error
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (!user) return; // Si no hay un usuario, no hacemos nada

    const channel = supabase
      .channel("custom-insert-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification" },
        async (payload) => {
          const notification = payload.new;
          if (notification.userID === user) {
            DeleteNotification(notification.id);
            toast("Notificación", {
              description: notification.mensaje,
              action: {
                label: "Cerrar",
              },
            });
          }
        }
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

const DeleteNotification = async (id) => {
  try {
    const { error } = await supabase.from("Notification").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar la notificación:", error);
    }
  } catch (error) {
    console.error("Error en la función DeleteNotification:", error);
  }
};
function OrderProducts(productos, categorias) {
  const productosOrdenados = {};

  // Inicializar el objeto con categorías vacías
  categorias.forEach((categoria) => {
    productosOrdenados[categoria] = [];
  });

  // Llenar el objeto con productos según su categoría
  productos
    .sort((a, b) => a.order - b.order)
    .forEach((producto) => {
      if (productosOrdenados[producto.caja]) {
        productosOrdenados[producto.caja].push(producto);
      }
    });

  return asignarOrden(productosOrdenados);
}
const asignarOrden = (productos) => {
  const resultadoFinal = [];
  Object.keys(productos).forEach((categoria) => {
    resultadoFinal.push(
      ...productos[categoria].map((prod, index) => ({
        ...prod,
        order: index,
      }))
    );
  });
  return resultadoFinal;
};
