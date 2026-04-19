// app/layout.js
import { Toaster as SileoToaster } from "sileo";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import MyProvider from "@/context/useContext";
import { fetchStoreData } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import { fetchGAData } from "@/lib/ga-utils";
import { redirect } from "next/navigation";
import "./globals.css";
import { getServerUser } from "@/lib/server-auth";

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = [
  "/login",
  "/createAccount",
  "/configPage",
  "/resetPassword",
];

export const metadata = {
  title: "RouAdmin",
  description: "Administracion de tiendas y catalogos online",
  openGraph: {
    title: "RouAdmin",
    description: "Administracion de tiendas y catalogos online",
    images: [
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1753574413/ChatGPT_Image_26_jul_2025_19_51_29_lvng2w.png",
    ],
  },
};

export default async function AdminLayout({ children }) {
  // getServerUser() usa cookies() internamente — el middleware ya refrescó el token
  const userData = await getServerUser();

  // ✅ Nueva estructura: { userId, user, error, errorType }
  const userId = userData?.userId ?? null;
  const errorType = userData?.errorType ?? null;

  // 📊 Logging diferenciado según tipo de error
  if (userId) {
    console.info("✅ Usuario autenticado:", userId);
  } else if (errorType) {
    console.warn(`⚠️ Sin sesión: ${errorType}`, userData?.error);
  } else {
    console.warn("⚠️ Sin sesión activa (razón desconocida)");
  }

  // ============================================================================
  // 📦 CARGAR DATOS DEL USUARIO (si existe)
  // ============================================================================

  let data = null;
  if (userId) {
    // Solo cargar datos si hay usuario
    data = await initializeData(userId);
  }

  return (
    <html lang="en">
      <body>
        {/* Pasa userId y datos al Provider */}
        <MyProvider user={userId} data={data || {}} sessionError={errorType}>
          <main>{children}</main>
          <SileoToaster position="top-center" />
          <UiToaster />
        </MyProvider>
      </body>
    </html>
  );
}

// ─── initializeData ───────────────────────────────────────────────────────────
export async function initializeData(userId) {
  if (!userId) return null;

  try {
    const { data: store, error } = await fetchStoreData(userId);
    console.log("Datos crudos del store:", { store, error });
    if (error || !store?.Sitios?.sitioweb) {
      console.error("Error fetching store data:", error);
      return { user: store };
    }

    const tiendaParsed = {
      ...store.Sitios,
      horario: JSON.parse(store.Sitios.horario),
      categoria: store.Sitios.categorias.sort((a, b) => a.order - b.order),
      envios: JSON.parse(store.Sitios.envios),
    };

    const eventsParsed = tiendaParsed.Events;
    const productosParsed = OrderProducts(
      store.Sitios.Products,
      tiendaParsed.categoria,
    );
    const gaData = await fetchGAData(tiendaParsed.sitioweb);

    delete tiendaParsed.Products;
    delete tiendaParsed.categorias;
    delete tiendaParsed.Events;
    delete store.Sitios;
    console.log({
      store: tiendaParsed,
      ga: gaData,
      products: (productosParsed || []).map((obj) => ({
        ...obj,
        visitas: obj.visitas ?? 0,
        caracteristicas: JSON.parse(obj?.caracteristicas || "[]"),
      })),
      events: eventsParsed,
      code: tiendaParsed.codeDiscount,
      user: store,
    });

    return {
      store: tiendaParsed,
      ga: gaData,
      products: (productosParsed || []).map((obj) => ({
        ...obj,
        visitas: obj.visitas ?? 0,
        caracteristicas: JSON.parse(obj?.caracteristicas || "[]"),
      })),
      events: eventsParsed,
      code: tiendaParsed.codeDiscount,
      user: store,
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
    return null;
  }
}
