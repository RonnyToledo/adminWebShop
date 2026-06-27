import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Cache de sesiones por tiempo limitado (30 segundos)
const sessionCache = new Map();

async function getSessionWithTimeout(supabase, timeoutMs = 15000) {
  try {
    const start = Date.now();
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("getSession timeout")), timeoutMs),
      ),
    ]);
    const elapsed = Date.now() - start;
    if (elapsed > 5000) {
      console.warn(
        `[Middleware] ⏱️ Sesión obtenida lentamente: ${elapsed}ms (timeout: ${timeoutMs}ms)`,
      );
    }
    return result;
  } catch (error) {
    console.warn(
      `[Middleware] Session fetch failed: ${error?.message} (timeout: ${timeoutMs}ms)`,
    );
    return { data: { session: undefined } };
  }
}

export async function middleware(req) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  requestHeaders.set("x-search", req.nextUrl.search); // ← NUEVO: e.g. "?add=true"

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Skip middleware para rutas públicas que no necesitan validación de sesión
  const pathname = req.nextUrl.pathname;
  const publicRoutes = [
    "/login",
    "/createAccount",
    "/api/login",
    "/api/logout",
  ];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await getSessionWithTimeout(supabase);

  if (session === null) {
    const hasCookies =
      req.cookies.has("sb-access-token") || req.cookies.has("sb-refresh-token");

    if (hasCookies) {
      console.warn("[Middleware] ❌ Session inválida, limpiando cookies");
      res.cookies.delete("sb-access-token");
      res.cookies.delete("sb-refresh-token");
    }
  } else if (session === undefined) {
    console.warn(
      "[Middleware] ⏱️ Timeout obteniendo sesión, cookies sin cambios",
    );
  } else {
    console.log(`[Middleware] ✅ Sesión activa: ${session.user?.email}`);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
