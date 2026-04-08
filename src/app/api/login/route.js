// app/api/login/route.js
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

// ─── Helper: validar estado del plan ─────────────────────────────────────────
// Devuelve null si todo está bien, o un string con el tipo de error
function checkPlanStatus(sitio) {
  if (!sitio) return "NO_STORE";
  if (!sitio.active) return "STORE_INACTIVE";

  const plan = sitio.plan ?? "trial";
  const plan_vence = sitio.plan_vence ?? null;

  // Sin fecha de vencimiento → no expira (plan asignado manualmente)
  if (!plan_vence) return null;

  const vencido = new Date(plan_vence) < new Date();
  if (!vencido) return null;

  // Vencido — diferenciar trial de plan de pago
  return plan === "trial" ? "PLAN_TRIAL_END" : "PLAN_VENCIDO";
}

// ─── GET: usuario autenticado actual ─────────────────────────────────────────
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("NO_AUTH");

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      user,
    });
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

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Autenticar
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) return errorResponse("BAD_CREDENTIALS");

    // 2. Consultar tienda asociada al usuario — incluye plan y plan_vence
    const { data: sitio, error: sitioError } = await supabase
      .from("Sitios")
      .select("UUID, sitioweb, active, plan, plan_vence, name")
      .eq("Editor", authData.user.id)
      .maybeSingle();

    // Si no tiene tienda dejamos pasar (puede ser un usuario nuevo sin tienda todavía)
    // Solo bloqueamos si tiene tienda pero está en mal estado
    if (!sitioError && sitio) {
      const planError = checkPlanStatus(sitio);
      if (planError) {
        // Cerramos la sesión que acabamos de abrir para no dejar estado inconsistente
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
      // Incluimos estado del plan para que el frontend lo muestre sin otro fetch
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

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { error } = await supabase.auth.signOut();
    if (error) return errorResponse("SERVER_ERROR", { detail: error.message });

    return NextResponse.json({ message: "Cierre de sesión exitoso" });
  } catch (err) {
    console.error("[DELETE /api/login]", err.message);
    return errorResponse("SERVER_ERROR", { detail: err.message });
  }
}
