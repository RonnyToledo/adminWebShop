import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MyProvider from "@/context/useContext";
import { fetchStoreData, fetchStoreShellData } from "@/lib/supabaseApi";
import { OrderProducts } from "@/utils/products";
import { fetchGAData } from "@/lib/ga-utils";
import { getServerUser } from "@/lib/server-auth";
import { BannerAdmin } from "@/utils/image";
import "./globals.css";

export const dynamic = "force-dynamic";

const PUBLIC_ROUTES = [
  "/login",
  "/createAccount",
  "/configPage",
  "/forgotPassword",
  "/resetPassword",
  "/auth/callback",
];

const LIGHT_ROUTES = [
  ...PUBLIC_ROUTES,
  "/welcome",
  "/updatePassword",
  "/conditions-of-service",
  "/teams-of-service",
];

const ROUTE_DATA_MIGRATED = [
  "/category",
  "/products",
  "/orders",
  "/codeDiscount",
  "/blog",
  "/analytics",
  "/configuracion",
  "/theme",
  "/social",
  "/ventas",
  "/newProduct",
  "/configuracion/domicilios",
  "/premium-clientes",
  "/guia",
  "/",
  "/notifications",
  "/planes",
  "/category",
  "/products",
  "/orders",
];

const adminTitle = "RouAdmin | Panel de administración para tiendas online";
const adminDescription =
  "Administra tu tienda, catálogo, ventas y pedidos desde RouAdmin.";

const ROUTE_METADATA = [
  {
    route: "/configuracion/domicilios",
    title: "Domicilios y envíos",
    description: "Configura las opciones de entrega y envío de tu tienda.",
  },
  {
    route: "/blog/new",
    title: "Crear entrada del blog",
    description: "Crea y edita publicaciones para el blog de tu tienda.",
  },
  {
    route: "/blog/",
    title: "Editar entrada del blog",
    description: "Edita una publicación del blog de tu tienda.",
  },
  {
    route: "/category/",
    title: "Editar categoría",
    description: "Consulta y edita la información de una categoría.",
  },
  {
    route: "/products/",
    title: "Editar producto",
    description: "Consulta y edita la información de un producto.",
  },
  {
    route: "/orders/",
    title: "Detalle del pedido",
    description: "Consulta los productos, pagos y estado de un pedido.",
  },
  {
    route: "/category",
    title: "Categorías",
    description: "Organiza las categorías del catálogo de tu tienda.",
  },
  {
    route: "/products",
    title: "Productos",
    description: "Administra los productos y variantes de tu catálogo.",
  },
  {
    route: "/orders",
    title: "Pedidos",
    description: "Consulta y administra los pedidos de tu tienda.",
  },
  {
    route: "/codeDiscount",
    title: "Códigos de descuento",
    description: "Crea y administra promociones para tus clientes.",
  },
  {
    route: "/blog",
    title: "Blog",
    description: "Administra las publicaciones del blog de tu tienda.",
  },
  {
    route: "/analytics",
    title: "Analítica",
    description: "Consulta las métricas y el rendimiento de tu tienda.",
  },
  {
    route: "/configuracion",
    title: "Configuración",
    description: "Administra los datos y preferencias de tu tienda.",
  },
  {
    route: "/theme",
    title: "Diseño de tienda",
    description: "Personaliza la apariencia de tu tienda online.",
  },
  {
    route: "/social",
    title: "Redes sociales",
    description: "Administra los enlaces y canales sociales de tu tienda.",
  },
  {
    route: "/ventas",
    title: "Ventas",
    description: "Revisa el resumen y el rendimiento de tus ventas.",
  },
  {
    route: "/newProduct",
    title: "Nuevo producto",
    description: "Agrega un producto nuevo al catálogo de tu tienda.",
  },
  {
    route: "/premium-clientes",
    title: "Clientes premium",
    description: "Administra los clientes y beneficios premium.",
  },
  {
    route: "/guia",
    title: "Guía",
    description: "Encuentra ayuda para configurar y administrar tu tienda.",
  },
  {
    route: "/notifications",
    title: "Notificaciones",
    description: "Consulta las notificaciones de administración de tu tienda.",
  },
  {
    route: "/planes",
    title: "Planes",
    description: "Consulta los planes disponibles para tu tienda.",
  },
  {
    route: "/team",
    title: "Equipo",
    description: "Administra el acceso de los miembros de tu equipo.",
  },
  {
    route: "/welcome",
    title: "Bienvenido",
    description: "Completa la configuración inicial de tu tienda en RouAdmin.",
  },
  {
    route: "/updatePassword",
    title: "Actualizar contraseña",
    description: "Actualiza la contraseña de acceso a tu cuenta de RouAdmin.",
  },
  {
    route: "/",
    title: "Inicio",
    description: "Resumen de actividad y accesos rápidos de tu tienda.",
  },
];

export async function generateMetadata() {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const pageMetadata = ROUTE_METADATA.find(({ route }) =>
    route.endsWith("/")
      ? pathname.startsWith(route)
      : matchesRoute(pathname, route),
  );
  const title = pageMetadata
    ? `${pageMetadata.title} | RouAdmin`
    : adminTitle;
  const description = pageMetadata?.description ?? adminDescription;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "RouAdmin",
      images: [{ url: BannerAdmin, alt: "RouAdmin, panel de administración" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BannerAdmin],
    },
  };
}

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
    data = ROUTE_DATA_MIGRATED.some((route) => matchesRoute(pathname, route))
      ? await initializeData(userId)
      : await initializeFullData(userId, {
          includeGA: shouldLoadAnalytics(pathname),
        });

    if (
      data?.store_access_resolved &&
      (data.user?.role === "user" || !data.store_role)
    ) {
      redirect("/welcome");
    }
  }

  return (
    <html lang="es">
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

function matchesRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function shouldLoadLayoutData(pathname) {
  return !LIGHT_ROUTES.some((route) => matchesRoute(pathname, route));
}

function shouldLoadAnalytics(pathname) {
  return pathname === "/" || matchesRoute(pathname, "/analytics");
}

export async function initializeData(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await fetchStoreShellData(userId);

    if (error) {
      console.error("Error fetching store data:", error);
      return {
        user: data?.user ?? null,
        store_role: null,
        store_access_resolved: false,
      };
    }

    if (!data?.store) {
      return {
        user: data?.user ?? null,
        store: null,
        store_role: null,
        store_access_resolved: true,
      };
    }

    return {
      user: data.user,
      store: data.store,
      store_role: data.store_role ?? "owner",
      store_access_resolved: true,
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
    return null;
  }
}

async function initializeFullData(userId, options = {}) {
  if (!userId) return null;

  const { includeGA = true } = options;

  try {
    const { data, error } = await fetchStoreData(userId);

    if (error) {
      console.error("Error fetching store data:", error);
      return {
        user: data?.user ?? null,
        store_role: null,
        store_access_resolved: false,
      };
    }

    if (!data?.store) {
      return {
        user: data?.user ?? null,
        store: null,
        store_role: null,
        store_access_resolved: true,
      };
    }

    const store = data.store;
    const categoriasOrdenadas = [...(store.categorias ?? [])].sort(
      (first, second) => (first.order ?? 0) - (second.order ?? 0),
    );
    const productosOrdenados = [...(store.Products ?? [])].sort(
      (first, second) => (first.order ?? 0) - (second.order ?? 0),
    );
    const safeJsonParse = (value, fallback = []) => {
      try {
        if (value == null || value === "") return fallback;
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };
    const tiendaParsed = {
      ...store,
      categoria: categoriasOrdenadas,
      envios: safeJsonParse(store.envios, []),
    };
    const productosParsed = OrderProducts(
      productosOrdenados,
      categoriasOrdenadas,
    );
    const gaData =
      includeGA && tiendaParsed.sitioweb
        ? await fetchGAData(tiendaParsed.sitioweb)
        : null;

    return {
      user: data.user,
      store: tiendaParsed,
      ga: gaData,
      products: (productosParsed || []).map((product) => ({
        ...product,
        visitas: product.visitas ?? 0,
        caracteristicas: safeJsonParse(product?.caracteristicas, []),
      })),
      events: [...(store.Events ?? [])],
      code: store.codeDiscount ?? [],
      store_role: data.store_role ?? "owner",
      store_access_resolved: true,
    };
  } catch (error) {
    console.error("Error inicializando datos:", error);
    return null;
  }
}
