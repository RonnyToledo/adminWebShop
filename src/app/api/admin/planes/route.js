// app/api/admin/planes/route.js
// ─── Activa un plan para una tienda (uso interno del admin) ──────────────────
// POST /api/admin/planes  { sitio_uuid, plan, notas? }
// GET  /api/admin/planes  → lista de todas las tiendas con su plan

import { supabase } from "@/lib/supa";
import { serverAuthService } from "@/lib/server-auth";
import { NextResponse } from "next/server";

// Solo tú (el admin) puedes llamar esto — verificamos por email o role
const ADMIN_EMAILS = [process.env.ADMIN_EMAIL].filter(Boolean);

async function checkIsAdmin(user) {
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  // O por metadata si usas Supabase roles:
  // return user.app_metadata?.role === "superadmin";
  return false;
}

// ── GET: dashboard de planes ──────────────────────────────────────────────────
export async function GET(request) {
  const user = await serverAuthService.getCurrentUser();
  if (!(await checkIsAdmin(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("plan_status") // vista que creamos en la migración
    .select("*")
    .order("dias_restantes", { ascending: true, nullsFirst: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// ── POST: activar plan para una tienda ────────────────────────────────────────
export async function POST(request) {
  const user = await serverAuthService.getCurrentUser();
  if (!(await checkIsAdmin(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.sitio_uuid || !body?.plan) {
    return NextResponse.json(
      { error: "Faltan campos: sitio_uuid, plan" },
      { status: 400 },
    );
  }

  const PLANES_VALIDOS = ["trial", "basico", "pro"];
  if (!PLANES_VALIDOS.includes(body.plan)) {
    return NextResponse.json(
      { error: `Plan inválido. Debe ser: ${PLANES_VALIDOS.join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("activar_plan", {
    p_sitio_uuid: body.sitio_uuid,
    p_plan: body.plan,
    p_admin_id: user.userId,
    p_notas: body.notas || null,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}
