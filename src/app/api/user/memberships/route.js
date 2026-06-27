import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

/**
 * GET /api/user/memberships
 *
 * Obtiene todas las membresías activas del usuario actual con info de la tienda.
 */
export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();

    const { data: memberships, error } = await supabase
      .from("store_members")
      .select(
        `id, store_role, store_id, created_at, active,
         store:store_id(UUID, name, Editor)`,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) return err(error.message, 500);

    return NextResponse.json({ memberships });
  } catch (e) {
    return err(e.message, 500);
  }
}
