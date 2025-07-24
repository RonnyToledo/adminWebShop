// middleware.js
import { NextResponse } from "next/server";

// Rutas que queremos proteger (tal como en tu JSON)
const protectedRoutes = [
  "/",
  "/guia",
  "/orders",
  "/category",
  "/newProduct",
  "/products",
  "/header",
  "/theme",
  "/codeDiscount",
  "/configuracion",
  "/analytics",
];

/**
 * Llama a tu endpoint GET /api/login para validar la sesión.
 * Devuelve el JSON de la API o null si no hay sesión.
 */
async function fetchUserSession(request) {
  const token = request.cookies.get("sb-access-token")?.value;
  if (!token) return null;

  try {
    const url = new URL("/api/login", request.url).toString();
    const res = await fetch(url, {
      method: "GET",
      headers: { Cookie: `sb-access-token=${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Error fetchUserSession en middleware:", e);
    return null;
  }
}

export async function middleware(request) {
  const { pathname, origin, search } = request.nextUrl;

  // Si la ruta NO está en nuestro listado de protegidas, saltamos el middleware
  if (!protectedRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Validamos sesión
  const sessionData = await fetchUserSession(request);
  const userId = sessionData?.user?.user?.id;

  if (!userId) {
    // Sin sesión → redirigir a /login conservando la ruta original
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión → dejamos continuar
  return NextResponse.next();
}

export const config = {
  // Solo lanzamos middleware para estas rutas exactas
  matcher: protectedRoutes,
};
