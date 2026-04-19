// app/api/admin/planes/route.js
// ─── Activa un plan para una tienda (uso interno del admin) ──────────────────
// GET  /api/admin/planes  → lista de todas las tiendas con su plan
// POST /api/admin/planes  { sitio_uuid, plan, notas? }

import { getServerUser } from "@/lib/server-auth"; // ← ya no importamos supa.js
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/route-handler-auth";

const ADMIN_EMAILS = [process.env.ADMIN_EMAIL].filter(Boolean);
const PLANES_VALIDOS = ["trial", "basico", "pro"];

async function checkIsAdmin(userData) {
  if (!userData) return false;
  return ADMIN_EMAILS.includes(userData.email);
  // O por metadata: userData.user?.app_metadata?.role === "superadmin"
}

// ── GET: dashboard de planes ──────────────────────────────────────────────────
export async function GET() {
  const userData = await getServerUser();
  if (!(await checkIsAdmin(userData))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = await createRouteSupabase();
  const { data, error } = await supabase
    .from("plan_status")
    .select("*")
    .order("dias_restantes", { ascending: true, nullsFirst: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// ── POST: activar plan para una tienda ────────────────────────────────────────
export async function POST(request) {
  const userData = await getServerUser();
  if (!(await checkIsAdmin(userData))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.sitio_uuid || !body?.plan) {
    return NextResponse.json(
      { error: "Faltan campos: sitio_uuid, plan" },
      { status: 400 },
    );
  }

  if (!PLANES_VALIDOS.includes(body.plan)) {
    return NextResponse.json(
      { error: `Plan inválido. Debe ser: ${PLANES_VALIDOS.join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = await createRouteSupabase();
  const { data, error } = await supabase.rpc("activar_plan", {
    p_sitio_uuid: body.sitio_uuid,
    p_plan: body.plan,
    p_admin_id: userData.userId,
    p_notas: body.notas || null,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}
