import { headers } from "next/headers";
import MyProvider from "@/context/useContext";
import { fetchStoreData } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import { fetchGAData } from "@/lib/ga-utils";
import { getServerUser } from "@/lib/server-auth";
import "./globals.css";

export const dynamic = "force-dynamic";

const PUBLIC_ROUTES = [
  "/login",
  "/createAccount",
  "/configPage",
  "/resetPassword",
];

const LIGHT_ROUTES = [
  ...PUBLIC_ROUTES,
  "/welcome",
  "/updatePassword",
  "/conditions-of-service",
  "/teams-of-service",
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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  // ── NUEVO: detectar ?add=true para el flujo de multi-cuenta ──────────────
  // El middleware debe reenviar el header "x-search" con la query string,
  // o podemos leerlo directamente desde "x-url" si lo configuras.
  // Como alternativa segura, leemos el referer o x-invoke-path completo.
  // La forma más simple es que el middleware copie la query en un header propio.
  // Si no tienes ese header aún, usamos la URL completa que Next expone.
  const xUrl = headersList.get("x-url") ?? ""; // puedes configurar esto en middleware
  const xSearch = headersList.get("x-search") ?? ""; // alternativa: solo la query string
  const isAddMode = xSearch.includes("add=true") || xUrl.includes("add=true");

  const userData = await getServerUser();
  const userId = userData?.userId ?? null;
  const errorType = userData?.errorType ?? null;

  if (errorType) {
    console.warn(
      `[AdminLayout] ⚠️ Sesión inválida - Tipo: ${errorType}`,
      userData?.error,
    );
  } else if (userId) {
    console.info(`[AdminLayout] ✅ Usuario autenticado: ${userData?.email}`);
  } else {
    console.info("[AdminLayout] ℹ️ Usuario no autenticado - Ruta pública");
  }

  let data = null;
  if (userId && shouldLoadLayoutData(pathname)) {
    data = await initializeData(userId, {
      includeGA: shouldLoadAnalytics(pathname),
    });
  }

  return (
    <html lang="en">
      <body>
        <MyProvider
          key={userId ?? "guest"}
          user={userId}
          data={data || {}}
          sessionError={errorType}
          isAddMode={isAddMode} // ← NUEVO: prop que controla el guard de redirección
        >
          <main>{children}</main>
        </MyProvider>
      </body>
    </html>
  );
}

const safeJsonParse = (value, fallback = []) => {
  try {
    if (value == null || value === "") return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

function matchesRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function shouldLoadLayoutData(pathname) {
  return !LIGHT_ROUTES.some((route) => matchesRoute(pathname, route));
}

function shouldLoadAnalytics(pathname) {
  return pathname === "/" || matchesRoute(pathname, "/analytics");
}

export async function initializeData(userId, options = {}) {
  if (!userId) return null;

  const { includeGA = true } = options;

  try {
    const { data, error } = await fetchStoreData(userId);

    if (error || !data?.store?.sitioweb) {
      console.error("Error fetching store data:", error);
      return { user: data?.user ?? null };
    }

    const store = data.store;
    const user = data.user;

    const categoriasOrdenadas = [...(store.categorias ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    const productosOrdenados = [...(store.Products ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    const tiendaParsed = {
      ...store,
      categoria: categoriasOrdenadas,
      envios: safeJsonParse(store.envios, []),
    };

    const eventsParsed = [...(store.Events ?? [])];
    const productosParsed = OrderProducts(
      productosOrdenados,
      categoriasOrdenadas,
    );

    const gaData =
      includeGA && tiendaParsed.sitioweb
        ? await fetchGAData(tiendaParsed.sitioweb)
        : null;

    return {
      user,
      store: tiendaParsed,
      ga: gaData,
      products: (productosParsed || []).map((obj) => ({
        ...obj,
        visitas: obj.visitas ?? 0,
        caracteristicas: safeJsonParse(obj?.caracteristicas, []),
      })),
      events: eventsParsed,
      code: store.codeDiscount ?? [],
      store_role: data.store_role ?? "owner",
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
    return null;
  }
}
