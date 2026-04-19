// app/api/login/route.js
// ─── Auth Route Handler ───────────────────────────────────────────────────────
// GET    → usuario actual
// POST   → sign in
// PUT    → sign up
// DELETE → sign out

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Respuestas de error tipadas ──────────────────────────────────────────────
const ERRORS = {
  NO_AUTH: { code: "NO_AUTH", message: "No autenticado", status: 401 },
  BAD_CREDENTIALS: {
    code: "BAD_CREDENTIALS",
    message: "Email o contraseña incorrectos",
    status: 401,
  },
  MISSING_FIELDS: {
    code: "MISSING_FIELDS",
    message: "Email y contraseña son requeridos",
    status: 400,
  },
  NO_STORE: {
    code: "NO_STORE",
    message: "El usuario no tiene una tienda asociada",
    status: 403,
  },
  STORE_INACTIVE: {
    code: "STORE_INACTIVE",
    message: "La tienda está desactivada",
    status: 403,
  },
  PLAN_VENCIDO: {
    code: "PLAN_VENCIDO",
    message: "El plan ha vencido. Contacta al soporte para renovarlo.",
    status: 403,
  },
  PLAN_TRIAL_END: {
    code: "PLAN_TRIAL_END",
    message:
      "El período de prueba ha finalizado. Elige un plan para continuar.",
    status: 403,
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Error interno del servidor",
    status: 500,
  },
};

function errorResponse(type, extra = {}) {
  const { status, ...body } = ERRORS[type];
  return NextResponse.json({ error: true, ...body, ...extra }, { status });
}

// ─── Helper: crear cliente con cookies ───────────────────────────────────────
async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

// ─── Helper: validar estado del plan ─────────────────────────────────────────
function checkPlanStatus(sitio) {
  if (!sitio) return "NO_STORE";
  if (!sitio.active) return "STORE_INACTIVE";

  const plan_vence = sitio.plan_vence ?? null;
  if (!plan_vence) return null; // sin fecha → no expira

  const vencido = new Date(plan_vence) < new Date();
  if (!vencido) return null;

  return (sitio.plan ?? "trial") === "trial"
    ? "PLAN_TRIAL_END"
    : "PLAN_VENCIDO";
}

// ─── GET: usuario autenticado actual ─────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await makeClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("NO_AUTH");

    return NextResponse.json({ userId: user.id, email: user.email, user });
  } catch (err) {
    console.error("[GET /api/login]", err.message);
    return errorResponse("SERVER_ERROR", { detail: err.message });
  }
}

// ─── POST: sign in ────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.email || !body?.password) return errorResponse("MISSING_FIELDS");

    const { email, password } = body;
    const supabase = await makeClient();

    // 1. Autenticar
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) return errorResponse("BAD_CREDENTIALS");

    // 2. Consultar tienda asociada
    const { data: sitio, error: sitioError } = await supabase
      .from("Sitios")
      .select("UUID, sitioweb, active, plan, plan_vence, name")
      .eq("Editor", authData.user.id)
      .maybeSingle();

    // Bloquear solo si tiene tienda pero está en mal estado
    if (!sitioError && sitio) {
      const planError = checkPlanStatus(sitio);
      if (planError) {
        await supabase.auth.signOut();
        return errorResponse(planError, {
          plan: sitio.plan,
          plan_vence: sitio.plan_vence,
          sitioweb: sitio.sitioweb,
        });
      }
    }

    return NextResponse.json({
      message: "Inicio de sesión exitoso",
      userId: authData.user.id,
      user: authData.user,
      session: authData.session,
      plan: sitio?.plan ?? null,
      plan_vence: sitio?.plan_vence ?? null,
      sitioweb: sitio?.sitioweb ?? null,
    });
  } catch (err) {
    console.error("[POST /api/login]", err.message);
    return errorResponse("SERVER_ERROR", { detail: err.message });
  }
}

// ─── PUT: sign up ─────────────────────────────────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.email || !body?.password) return errorResponse("MISSING_FIELDS");

    const { email, password, metadata } = body;
    const supabase = await makeClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata || {} },
    });

    if (error) {
      return NextResponse.json(
        { error: true, code: "SIGNUP_ERROR", message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Registro exitoso",
      userId: data.user?.id,
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error("[PUT /api/login]", err.message);
    return errorResponse("SERVER_ERROR", { detail: err.message });
  }
}

// ─── DELETE: sign out ─────────────────────────────────────────────────────────
export async function DELETE() {
  try {
    const supabase = await makeClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      // ❌ signOut falló, pero aún así intentamos limpiar cookies desde servidor
      console.warn("[DELETE /api/login] signOut failed:", error.message);

      const response = errorResponse("SERVER_ERROR", {
        detail: "Logout incompleto: " + error.message,
      });

      // Limpiar cookies de todas formas (respuesta fallida pero con limpieza)
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");

      return response;
    }

    // ✅ Logout exitoso - Supabase automáticamente limpia cookies
    // Pero aseguramos que estén limpias en la response también
    const response = NextResponse.json({
      message: "Cierre de sesión exitoso",
      timestamp: new Date().toISOString(),
    });

    // Asegurar limpieza en caso de que Supabase no lo haga completamente
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (err) {
    console.error("[DELETE /api/login] Exception:", err.message);

    // Incluso en excepción, intentar limpiar cookies
    const response = errorResponse("SERVER_ERROR", {
      detail: "Error durante logout: " + err.message,
    });

    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  }
}
