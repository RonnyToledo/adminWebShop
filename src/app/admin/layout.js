"use client";
import { supabase } from "@/lib/supa";
import { useRouter } from "next/navigation";
import { useState, useEffect, createContext } from "react";
import { Toaster } from "@/components/ui/toaster";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";

export const ThemeContext = createContext();

async function fetchUserSession() {
  return new Promise((resolve) => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        resolve(null);
      } else {
        resolve(session.user.id);
      }
    });
  });
}

async function fetchWebshopData(sitioweb, UUID) {
  try {
    const { data: productos, error: errorProductos } = await supabase
      .from("Products")
      .select("*")
      .eq("storeId", UUID);
    if (errorProductos) {
      throw new Error("Error al cargar productos.");
    }

    const productosParsed = productos.map((producto) => ({
      ...producto,
      agregados: JSON.parse(producto.agregados),
      coment: JSON.parse(producto.coment),
    }));

    const { data: events, error: errorEvents } = await supabase
      .from("Events")
      .select("*")
      .eq("tienda", sitioweb);
    if (errorEvents) {
      throw new Error("Error al cargar eventos.");
    }

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

export default function RootLayout({ children }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [user, setuser] = useState("");
  const [webshop, setwebshop] = useState({
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

  const Log_Out = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error);
    } else {
      router.replace("/");
    }
  };
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userId = await fetchUserSession();
        if (!userId) {
          router.replace("/"); // Cambié push() por replace() para evitar que se quede en el historial
          return;
        }

        setuser(userId);

        const { data: a, error: errorTienda } = await supabase
          .from("Sitios")
          .select("*")
          .eq("Editor", userId);

        if (a?.length > 0) {
          const [tienda] = a;
          if (!tienda?.login) {
            Log_Out();
          }
          if (errorTienda) {
            throw new Error("Error al cargar tienda o tienda no encontrada.");
          }
          if (tienda) {
            const tiendaParsed = {
              ...tienda,
              moneda: JSON.parse(tienda.moneda),
              moneda_default: JSON.parse(tienda.moneda_default),
              horario: JSON.parse(tienda.horario),
              comentario: JSON.parse(tienda.comentario),
              categoria: JSON.parse(tienda.categoria),
              envios: JSON.parse(tienda.envios),
            };
            const webshopData = await fetchWebshopData(
              tienda.sitioweb,
              tienda.UUID
            );
            setwebshop({ store: tiendaParsed, ...webshopData });
          } else {
            setIsNewUser(true);
            router.replace("/welcome");
          }
        } else {
          router.replace("/admin/configPage");
        }
      } catch (error) {
        console.error("Error al inicializar los datos:", error);
      }
    };

    initializeData();
  }, [router]);

  return (
    <html lang="en">
      <body>
        <ThemeContext.Provider value={{ webshop, setwebshop }}>
          {!isNewUser ? (
            <>
              <HeaderAdmin ThemeContext={ThemeContext} />
              <main className="sm:pl-14">{children}</main>
            </>
          ) : (
            <></>
          )}
        </ThemeContext.Provider>
        <Toaster />
      </body>
    </html>
  );
}
