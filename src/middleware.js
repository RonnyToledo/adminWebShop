import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Reintentos exponenciales para getSession
async function getSessionWithRetry(supabase, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 5000),
        ),
      ]);
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Esperar antes de reintentar (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Log del error pero no fallar - las cookies pueden estar válidas
  console.warn("getSession failed after retries:", lastError?.message);
  return { data: { session: null } };
}

export async function middleware(req) {
  const res = NextResponse.next();
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

  // Refresh de sesión en cada navegación con reintentos exponenciales
  // para mantener sincronizadas las cookies que leen los Server Components y Route Handlers.
  try {
    const {
      data: { session },
    } = await getSessionWithRetry(supabase);

    // ✅ Si sesión es null pero hay cookies, significa cookies inválidas
    // Limpiarlas proactivamente para evitar "fantasmas"
    if (!session) {
      const hasCookies =
        req.cookies.has("sb-access-token") ||
        req.cookies.has("sb-refresh-token");

      if (hasCookies) {
        console.warn("Middleware: Cookies inválidas detectadas, limpiando...");
        // Limpiar cookies del response para que el navegador las elimine
        res.cookies.delete("sb-access-token");
        res.cookies.delete("sb-refresh-token");
      }
    }
  } catch (error) {
    // ⚠️ Si getSessionWithRetry falla, es probable que las cookies sean inválidas
    // Limpiarlas de todas formas
    console.error("Middleware: Error sincronizando sesión:", error);

    const hasCookies =
      req.cookies.has("sb-access-token") || req.cookies.has("sb-refresh-token");

    if (hasCookies) {
      console.warn("Middleware: Limpiando cookies después de error...");
      res.cookies.delete("sb-access-token");
      res.cookies.delete("sb-refresh-token");
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
