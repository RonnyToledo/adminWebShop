import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { sendPushToUser } from "@/lib/server/push-notifications";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

/**
 * GET /api/admin/owner-requests
 *
 * Admin puede listar todas las solicitudes de owner pendientes.
 *
 * Query params:
 * - status: "pending" | "approved" | "rejected" (default: "pending")
 * - limit: 50 (default)
 */
export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();

    // Validar permisos admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) return err(adminError.message, 500);
    if (!adminCheck || adminCheck.role !== "admin") {
      return err("Solo administradores", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const { data: requests, error } = await supabase
      .from("owner_requests")
      .select(
        `id, user_id, email, store_name, store_type, country, provincia, 
         phone, status, rejection_reason, created_at, reviewed_at,
         user:user_id(id, name, email)`,
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return err(error.message, 500);

    return NextResponse.json({ requests, total: requests?.length ?? 0 });
  } catch (e) {
    return err(e.message, 500);
  }
}

/**
 * POST /api/admin/owner-requests
 *
 * Admin aprueba o rechaza una solicitud de owner.
 *
 * Body:
 * {
 *   request_id: 123,
 *   approve: true/false,
 *   rejection_reason: "optional reason if rejecting"
 * }
 */
export async function POST(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const body = await request.json();

    const { request_id, approve, rejection_reason } = body;

    if (request_id === undefined || approve === undefined) {
      return err("Faltan campos: request_id, approve");
    }

    // Validar permisos admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) return err(adminError.message, 500);
    if (!adminCheck || adminCheck.role !== "admin") {
      return err("Solo administradores", 403);
    }

    // Obtener la solicitud
    const { data: ownerRequest, error: requestError } = await supabase
      .from("owner_requests")
      .select("id, user_id, email, store_name, status")
      .eq("id", request_id)
      .maybeSingle();

    if (requestError) return err(requestError.message, 500);
    if (!ownerRequest) {
      return err("Solicitud no encontrada", 404);
    }

    if (ownerRequest.status !== "pending") {
      return err("Esta solicitud ya fue revisada", 409);
    }

    const newStatus = approve ? "approved" : "rejected";

    // Actualizar solicitud
    const { error: updateError } = await supabase
      .from("owner_requests")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: !approve ? rejection_reason : null,
      })
      .eq("id", request_id);

    if (updateError) return err(updateError.message, 500);

    // Si es aprobada, crear la tienda automáticamente
    if (approve) {
      // Crear tienda usando RPC create_sitio
      const { data: createResult, error: createError } = await supabase.rpc(
        "create_sitio",
        {
          _name: ownerRequest.store_name,
          _editor: ownerRequest.user_id,
          _email: ownerRequest.email,
          _tipo: ownerRequest.store_type,
          _country: ownerRequest.country,
          _provincia: ownerRequest.provincia,
          _active: true,
        },
      );

      if (createError) {
        // Revertir cambio
        await supabase
          .from("owner_requests")
          .update({ status: "pending", reviewed_by: null, reviewed_at: null })
          .eq("id", request_id);

        return err("Error al crear tienda: " + createError.message, 500);
      }

      // Notificar usuario de aprobación
      const notificationMessage = `¡Felicidades! Tu solicitud para crear la tienda "${ownerRequest.store_name}" fue aprobada.`;
      const { error: notificationError } = await supabase.from("Notification").insert({
        userID: ownerRequest.user_id,
        mensaje: notificationMessage,
        link: "/",
      });
      if (notificationError) {
        console.error("No se pudo guardar la notificación de aprobación:", notificationError);
      } else {
        await sendPushToUser(ownerRequest.user_id, {
          title: "Solicitud aprobada",
          body: notificationMessage,
          link: "/",
        });
      }
    } else {
      // Notificar rechazo
      const notificationMessage = `Tu solicitud para crear tienda fue rechazada. Razón: ${rejection_reason || "No especificada"}`;
      const { error: notificationError } = await supabase.from("Notification").insert({
        userID: ownerRequest.user_id,
        mensaje: notificationMessage,
        link: "/",
      });
      if (notificationError) {
        console.error("No se pudo guardar la notificación de rechazo:", notificationError);
      } else {
        await sendPushToUser(ownerRequest.user_id, {
          title: "Solicitud revisada",
          body: notificationMessage,
          link: "/",
        });
      }
    }

    // Auditar
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: approve ? "owner.request_approved" : "owner.request_rejected",
      entity: "owner_requests",
      entity_id: String(request_id),
      payload: {
        store_name: ownerRequest.store_name,
        reason: rejection_reason,
      },
    });

    return NextResponse.json({
      message: approve
        ? "Solicitud aprobada. Tienda creada."
        : "Solicitud rechazada.",
    });
  } catch (e) {
    return err(e.message, 500);
  }
}
