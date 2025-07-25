// app/layout.js
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import styles from "./Sonner.module.css";
import MyProvider from "@/context/useContext";
import { fetchStoreData } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata = {
  title: "ADMIN",
  description: "ADMIN R&H",
  openGraph: {
    title: "ADMIN",
    description: "ADMIN R&H",
    images: [
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1721753647/kiphxzqvoa66wisrc1qf.jpg",
    ],
  },
};
export default async function AdminLayout({ children }) {
  const userSession = await fetchUserSessionServer();
  const user = userSession?.user?.user?.id;
  const data = await initializeData(userSession?.user?.user?.id);

  return (
    <html lang="en">
      <body>
        <MyProvider user={user} data={data || {}}>
          <main className="sm:pl-14">{children}</main>

          <SonnerToaster className={styles.sonner_dark} />
          <UiToaster />
        </MyProvider>
      </body>
    </html>
  );
}

export const initializeData = async (userId) => {
  try {
    if (!userId) return null;

    const { data: store, error } = await fetchStoreData(userId);
    if (error) {
      console.error("Error fetching store data:", error);
      return null;
    }
    if (error || !store?.login || !store?.Sitios?.sitioweb) return null;

    const tiendaParsed = {
      ...store.Sitios,
      moneda: JSON.parse(store.Sitios.moneda),
      moneda_default: JSON.parse(store.Sitios.moneda_default),
      horario: JSON.parse(store.Sitios.horario),
      categoria: store.Sitios.categorias.sort((a, b) => a.order - b.order),
      envios: JSON.parse(store.Sitios.envios),
    };

    const eventsParsed = tiendaParsed.Events.map((event) => ({
      ...event,
      desc: JSON.parse(event.desc),
    }));

    const productosParsed = OrderProducts(
      store.Sitios.Products,
      tiendaParsed.categoria
    );

    // Fetch Google Analytics data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PATH}/api/tienda/${tiendaParsed.sitioweb}/GA`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const gaData = await response.json();

    //DElete products and categories
    delete tiendaParsed.Products;
    delete tiendaParsed.categorias;
    delete tiendaParsed.Events;
    delete store.Sitios;

    return {
      store: tiendaParsed,
      ga: gaData,
      products: productosParsed.map((obj) => ({
        ...obj,
        visitas: gaData.visitasProductos[obj.productId] || 0,
      })),
      events: eventsParsed,
      code: tiendaParsed.codeDiscount,
      user: store,
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
  }
};
export async function fetchUserSessionServer() {
  const Allcookies = await cookies();
  const sessionCookie = Allcookies.get("sb-access-token");

  if (!sessionCookie) {
    console.warn("No hay cookie de sesión disponible en el servidor.");
    return null;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
      method: "GET",
      headers: {
        Cookie: `sb-access-token=${sessionCookie.value}`, // Agrega la cookie manualmente
      },
    });

    if (!res.ok) {
      console.error("Error en la respuesta del servidor:", res.statusText);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error al obtener la sesión en el servidor:", error);
    return null;
  }
}
