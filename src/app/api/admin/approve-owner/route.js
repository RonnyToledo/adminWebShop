import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { sendPushToUser } from "@/lib/server/push-notifications";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

/**
 * POST /api/admin/approve-owner
 *
 * Permite a un ADMIN GLOBAL aprobar a un usuario para ser owner de una tienda.
 *
 * Body:
 * {
 *   user_email: "user@email.com",
 *   store_id: "uuid",
 *   approve: true/false
 * }
 */
export async function POST(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const body = await request.json();

    const { user_email, store_id, approve } = body;

    if (!user_email || !store_id || approve === undefined) {
      return err("Faltan campos: user_email, store_id, approve");
    }

    // 🔒 Validar que el usuario actual sea ADMIN GLOBAL (verificar en tabla de admins)
    const { data: adminCheck, error: adminError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) return err(adminError.message, 500);
    if (!adminCheck || adminCheck.role !== "admin") {
      return err("Solo administradores pueden aprobar owners", 403);
    }

    // Obtener el usuario por email
    const { data: targetUser, error: userError } = await supabase
      .from("user")
      .select("id, email, role")
      .eq("email", user_email)
      .maybeSingle();

    if (userError) return err(userError.message, 500);
    if (!targetUser) {
      return err("Usuario no encontrado", 404);
    }

    // Validar que la tienda exista
    const { data: store, error: storeError } = await supabase
      .from("Sitios")
      .select("UUID, Editor, name")
      .eq("UUID", store_id)
      .maybeSingle();

    if (storeError) return err(storeError.message, 500);
    if (!store) {
      return err("Tienda no encontrada", 404);
    }

    if (!approve) {
      // Si no aprueba, crear registro de auditoría y devolver
      await supabase.from("audit_log").insert({
        store_id,
        user_id: user.id,
        store_role: "admin",
        action: "owner.approval_rejected",
        entity: "user",
        entity_id: targetUser.id,
        payload: { reason: "Admin rejected" },
      });

      return NextResponse.json({
        message: "Solicitud de owner rechazada",
      });
    }

    // Aprobar: asignar como owner en store_members
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("store_members")
      .select("id, store_role, active")
      .eq("store_id", store_id)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (memberCheckError) return err(memberCheckError.message, 500);

    if (existingMember) {
      if (!existingMember.active) {
        // Reactivar y cambiar rol a owner
        const { error: updateError } = await supabase
          .from("store_members")
          .update({ store_role: "owner", active: true })
          .eq("id", existingMember.id);

        if (updateError) return err(updateError.message, 500);
      } else if (existingMember.store_role !== "owner") {
        // Ya es miembro, cambiar rol a owner
        const { error: updateError } = await supabase
          .from("store_members")
          .update({ store_role: "owner" })
          .eq("id", existingMember.id);

        if (updateError) return err(updateError.message, 500);
      } else {
        return err("El usuario ya es owner de esta tienda", 409);
      }
    } else {
      // Crear nuevo registro como owner
      const { error: insertError } = await supabase
        .from("store_members")
        .insert({
          store_id,
          user_id: targetUser.id,
          store_role: "owner",
          invited_by: user.id,
          active: true,
        });

      if (insertError) return err(insertError.message, 500);
    }

    // Auditar
    await supabase.from("audit_log").insert({
      store_id,
      user_id: user.id,
      store_role: "admin",
      action: "owner.approved",
      entity: "store_members",
      entity_id: targetUser.id,
      payload: { email: targetUser.email, store_name: store.name },
    });

    // Notificar al usuario
    const notificationMessage = `Felicidades! Ahora eres owner de la tienda: ${store.name}`;
    const { error: notificationError } = await supabase.from("Notification").insert({
      userID: targetUser.id,
      mensaje: notificationMessage,
      link: "/",
    });
    if (notificationError) {
      console.error("No se pudo guardar la notificación de aprobación:", notificationError);
    } else {
      await sendPushToUser(targetUser.id, {
        title: "Acceso de owner aprobado",
        body: notificationMessage,
        link: "/",
      });
    }

    return NextResponse.json({
      message: "Usuario aprobado como owner",
      user_id: targetUser.id,
      store_id,
    });
  } catch (e) {
    return err(e.message, 500);
  }
}
