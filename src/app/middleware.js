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

  // Rutas protegidas
  const protectedPaths = ["/", "/", "/"];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirigir a login si no hay sesión en ruta protegida
  if (isProtectedPath && !session) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir a dashboard si ya está autenticado e intenta ir a login
  if (req.nextUrl.pathname === "/login" && session) {
    const redirectUrl = new URL("/", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
  ],
};
