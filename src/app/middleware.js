// middleware.js
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refrescar sesión si está expirada
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Rutas públicas que no requieren sesión
  const publicPaths = ["/login", "/configPage", "/resetPassword"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Redirigir a login si no hay sesión y no es ruta pública
  if (!session && !isPublicPath) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir a dashboard si ya está autenticado e intenta ir a login
  if (session && pathname === "/login") {
    const redirectUrl = new URL("/", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto las que comienzan con:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (archivo de icono)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
