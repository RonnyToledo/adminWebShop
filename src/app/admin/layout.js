"use client";

import { useState, useEffect, createContext } from "react";
import { supabase } from "@/lib/supa";
import { useRouter } from "next/navigation";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";
import { Toaster } from "@/components/ui/toaster";

export const ThemeContext = createContext();

async function fetchUserSession() {
  return new Promise((resolve) => {
    supabase.auth.onAuthStateChange((event, session) => {
      resolve(session ? session.user.id : null);
    });
  });
}

async function fetchWebshopData(sitioweb, UUID) {
  try {
    const { data: productos } = await supabase
      .from("Products")
      .select("*")
      .eq("storeId", UUID);

    const productosParsed = productos.map((producto) => ({
      ...producto,
      agregados: JSON.parse(producto.agregados),
      coment: JSON.parse(producto.coment),
    }));

    const { data: events } = await supabase
      .from("Events")
      .select("*")
      .eq("tienda", sitioweb);

    const eventsParsed = events.map((event) => ({
      ...event,
      desc: JSON.parse(event.desc),
    }));

    return {
      products: productosParsed,
      events: eventsParsed,
    };
  } catch (error) {
    console.error("Error al obtener datos:", error);
    throw error;
  }
}

export default function AdminLayout({ children }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [user, setUser] = useState("");
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
    events: [],
  });

  const router = useRouter();

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userId = await fetchUserSession();
        if (!userId) {
          router.replace("/");
          return;
        }

        setUser(userId);

        const { data: stores } = await supabase
          .from("Sitios")
          .select("*")
          .eq("Editor", userId);

        if (stores?.length > 0) {
          const store = stores[0];
          if (!store?.login) {
            router.replace("/welcome");
          } else if (!store?.active) {
            router.replace("/admin/configPage");
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

            const webshopData = await fetchWebshopData(
              store.sitioweb,
              store.UUID
            );
            setWebshop({ store: tiendaParsed, ...webshopData });
          }
        } else {
          router.replace("/admin/configPage");
        }
      } catch (error) {
        console.error("Error inicializando datos:", error);
      }
    };

    initializeData();
  }, [router]);

  return (
    <ThemeContext.Provider value={{ webshop, setWebshop }}>
      {!isNewUser && <HeaderAdmin ThemeContext={ThemeContext} />}
      <main className="sm:pl-14">{children}</main>
      <Toaster />
    </ThemeContext.Provider>
  );
}
