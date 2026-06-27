import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

/**
 * POST /api/user/request-owner
 *
 * Usuario solicita ser owner de una nueva tienda.
 * Sus datos se guardan en una tabla "owner_requests" para que admin los apruebe.
 *
 * Body:
 * {
 *   store_name: "Mi Tienda",
 *   store_type: "Cafetería",
 *   country: "Cuba",
 *   provincia: "La Habana",
 *   phone: "5352489105"
 * }
 */
export async function POST(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const body = await request.json();

    const { store_name, store_type, country, provincia, phone } = body;

    if (!store_name || !store_type || !country || !provincia) {
      return err("Faltan campos: store_name, store_type, country, provincia");
    }

    // Verificar que el usuario no sea ya owner
    const { data: existingOwner, error: checkError } = await supabase
      .from("store_members")
      .select("store_id")
      .eq("user_id", user.id)
      .eq("store_role", "owner")
      .eq("active", true)
      .maybeSingle();

    if (checkError) return err(checkError.message, 500);
    if (existingOwner) {
      return err("Ya eres owner de una tienda. No puedes solicitar otra.", 403);
    }

    // Buscar solicitud pendiente
    const { data: pendingRequest, error: pendingError } = await supabase
      .from("owner_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) return err(pendingError.message, 500);
    if (pendingRequest) {
      return err(
        "Ya tienes una solicitud pendiente. Espera a que sea revisada.",
        409,
      );
    }

    // Obtener email del usuario
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) return err(userError.message, 500);

    // Crear solicitud
    const { data: newRequest, error: insertError } = await supabase
      .from("owner_requests")
      .insert({
        user_id: user.id,
        email: userData?.email,
        store_name,
        store_type,
        country,
        provincia,
        phone,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select();

    if (insertError) return err(insertError.message, 500);

    // Auditar
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "owner.requested",
      entity: "owner_requests",
      entity_id: newRequest?.[0]?.id,
      payload: {
        store_name,
        store_type,
        country,
        provincia,
      },
    });

    return NextResponse.json({
      message: "Solicitud enviada. Un administrador la revisará pronto.",
      request_id: newRequest?.[0]?.id,
    });
  } catch (e) {
    return err(e.message, 500);
  }
}

/**
 * GET /api/user/request-owner
 *
 * Obtener el estado de la solicitud del usuario.
 */
export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();

    const { data: requests, error } = await supabase
      .from("owner_requests")
      .select("id, status, created_at, rejection_reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return err(error.message, 500);

    return NextResponse.json({ requests });
  } catch (e) {
    return err(e.message, 500);
  }
}
