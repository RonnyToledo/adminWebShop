// ============================================
// 4. layout.js (OPTIMIZADO)
// ============================================
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import styles from "./Sonner.module.css";
import MyProvider from "@/context/useContext";
import { fetchStoreData } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import { fetchUserSessionServer } from "@/components/globalFunction/loginFunction";
import "./globals.css";

export const metadata = {
  title: "ADMIN",
  description: "ADMIN R&H",
  openGraph: {
    title: "ADMIN",
    description: "ADMIN R&H",
    images: [
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1753574413/ChatGPT_Image_26_jul_2025_19_51_29_lvng2w.png",
    ],
  },
};

export default async function AdminLayout({ children }) {
  const userSession = await fetchUserSessionServer();
  const userId = userSession?.id;

  if (userId) {
    console.info("Usuario recibido:", userId);
  } else {
    console.warn("No hay usuario, redirigiendo a login");
  }

  const data = await initializeData(userId);

  return (
    <html lang="en">
      <body>
        <MyProvider user={userId} data={data || {}}>
          <main className="">{children}</main>
          <SonnerToaster position="top-center" richColors />
          <UiToaster />
        </MyProvider>
      </body>
    </html>
  );
}

async function initializeData(userId) {
  if (!userId) return null;

  try {
    const { data: store, error } = await fetchStoreData(userId);

    if (error || !store?.login || !store?.Sitios?.sitioweb) {
      return { user: store };
    }

    const tiendaParsed = {
      ...store?.Sitios,
      horario: JSON.parse(store?.Sitios?.horario),
      categoria: store?.Sitios?.categorias.sort((a, b) => a.order - b.order),
      envios: JSON.parse(store?.Sitios?.envios),
      edit:
        typeof store?.Sitios?.edit === "string"
          ? JSON.parse(store?.Sitios?.edit)
          : store?.Sitios?.edit,
    };

    const eventsParsed =
      tiendaParsed?.Events?.map((event) => ({
        ...event,
        desc: JSON.parse(event.desc),
      })) || [];

    const productosParsed = OrderProducts(
      store?.Sitios?.Products,
      tiendaParsed?.categoria
    );

    // Fetch Google Analytics
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DEPLOYMENT}/api/tienda/${tiendaParsed?.sitioweb}/GA`
    );

    const gaData = response.ok ? await response.json() : {};

    // Cleanup
    delete tiendaParsed?.Products;
    delete tiendaParsed?.categorias;
    delete tiendaParsed?.Events;
    delete store?.Sitios;

    return {
      store: tiendaParsed,
      ga: gaData,
      products: (productosParsed || []).map((obj) => ({
        ...obj,
        visitas: obj.visitas ?? 0,
        caracteristicas: JSON.parse(obj?.caracteristicas || "[]"),
      })),
      events: eventsParsed,
      code: tiendaParsed?.codeDiscount,
      user: store,
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
    return null;
  }
}
