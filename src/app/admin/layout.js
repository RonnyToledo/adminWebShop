"use client";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, createContext } from "react";
import { Toaster } from "@/components/ui/toaster";
import HeaderAdmin from "@/components/Chadcn-components/HeaderAdmin";

export const ThemeContext = createContext();

export default function RootLayout({ children }) {
  const [webshop, setwebshop] = useState({
    store: {
      moneda_default: {},
      moneda: [],
      horario: [],
      comentario: [],
      categoria: [],
      envios: [],
      insta: "",
    },
    products: [],
    events: [],
    cambio: false,
  });
  const [userId, setuserId] = useState("");

  const supabase = createClient();
  const router = useRouter();

  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      router.push("/");
    }
    setuserId(session?.user.id);
  });

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        if (userId) {
          const { data: tienda, errorTienda } = await supabase
            .from("Sitios")
            .select("*")
            .eq("Editor", userId || null);

          const [a] = tienda;
          const b = {
            ...a,
            moneda: JSON.parse(a.moneda),
            moneda_default: JSON.parse(a.moneda_default),
            horario: JSON.parse(a.horario),
            comentario: JSON.parse(a.comentario),
            categoria: JSON.parse(a.categoria),
            envios: JSON.parse(a.envios),
          };
          const { data: productos, errorProductos } = await supabase
            .from("Products")
            .select("*")
            .eq("storeId", b.UUID);
          const c = productos.map((obj) => ({
            ...obj,
            agregados: JSON.parse(obj.agregados),
            coment: JSON.parse(obj.coment),
          }));
          const { data: events, errorEvents } = await supabase
            .from("Events")
            .select("*")
            .eq("tienda", b.sitioweb);
          const d = events.map((obj) => ({
            ...obj,
            desc: JSON.parse(obj.desc),
          }));

          setwebshop({
            ...webshop,
            store: b,
            products: c,
            events: d,
            cambio: false,
          });
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
        // Manejo de errores (opcional)
      }
    };
    obtenerDatos();
  }, [userId, setwebshop.cambio]);
  console.log(webshop);
  return (
    <html lang="en">
      <body>
        <HeaderAdmin ThemeContext={ThemeContext} />
        <ThemeContext.Provider value={{ webshop, setwebshop }}>
          {children}
        </ThemeContext.Provider>

        <Toaster />
      </body>
    </html>
  );
}
