//api/team/route.js
import { NextResponse } from "next/server";
import { sendInviteEmail } from "@/utils/resend";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { sendPushToUser } from "@/lib/server/push-notifications";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

const VALID_ROLES = ["admin", "editor", "analyst", "support"];
const ASSIGNABLE_BY_ROLE = {
  owner: ["admin", "editor", "analyst", "support"],
  admin: ["editor", "analyst", "support"],
};

// GET — listar miembros de la tienda
export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) return err("store_id requerido");

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self) return err("Sin acceso a esta tienda", 403);

    const { data: members, error } = await supabase
      .from("store_members")
      .select(
        `id, store_role, user_id, created_at,
         user:user_id(id, name, email, image)`,
      )
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) return err(error.message, 500);

    return NextResponse.json({ members });
  } catch (e) {
    return err(e.message, 500);
  }
}

// POST — invitar usuario a la tienda
export async function POST(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const body = await request.json();

    const store_id = body.store_id;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const role = body.store_role ?? body.role;

    if (!store_id || !email || !role) return err("Faltan campos");
    if (!VALID_ROLES.includes(role)) return err("Rol inválido");
    if (role === "owner") return err("No se pueden crear nuevos owners", 403);

    // Verificar que quien invita tiene permisos
    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", store_id)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self || !["owner", "admin"].includes(self.store_role)) {
      return err("Sin permisos", 403);
    }

    const allowed = ASSIGNABLE_BY_ROLE[self.store_role] ?? [];
    if (!allowed.includes(role)) return err("No podés asignar ese rol", 403);

    // Verificar si el usuario ya existe en el sistema
    const { data: existingUser, error: userError } = await supabase
      .from("user")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (userError) return err(userError.message, 500);

    if (existingUser) {
      // No permitir invitar a alguien que ya es owner activo en otra tienda
      const { data: ownerRoles, error: ownerCheckError } = await supabase
        .from("store_members")
        .select("id, store_id")
        .eq("user_id", existingUser.id)
        .eq("store_role", "owner")
        .eq("active", true);

      if (ownerCheckError) return err(ownerCheckError.message, 500);

      const isOwnerElsewhere =
        ownerRoles?.length > 0 &&
        !ownerRoles.some((m) => m.store_id === store_id);
      if (isOwnerElsewhere) {
        return err("Este usuario ya es owner de otra tienda", 403);
      }

      // Verificar que no sea ya miembro activo
      const { data: alreadyMember, error: memberCheckError } = await supabase
        .from("store_members")
        .select("id")
        .eq("store_id", store_id)
        .eq("user_id", existingUser.id)
        .eq("active", true)
        .maybeSingle();

      if (memberCheckError) return err(memberCheckError.message, 500);
      if (alreadyMember)
        return err("Ese usuario ya pertenece a esta tienda", 409);
    }

    // Obtener info de la tienda (necesaria para email y notificación)
    const { data: storeInfo, error: storeInfoError } = await supabase
      .from("Sitios")
      .select("name, UUID")
      .eq("UUID", store_id)
      .maybeSingle();

    if (storeInfoError) return err(storeInfoError.message, 500);

    // ── Caso A: usuario ya existe → membresía activa inmediata ──────────────
    if (existingUser) {
      // Crear membresía activa
      const { error: memberInsertError } = await supabase
        .from("store_members")
        .insert({
          store_id,
          user_id: existingUser.id,
          store_role: role,
          active: true,
          invited_by: user.id,
        });

      if (memberInsertError) return err(memberInsertError.message, 500);

      // Actualizar role global a "manager" si era "user"
      if (existingUser.role === "user") {
        await supabase
          .from("user")
          .update({ role: "manager" })
          .eq("id", existingUser.id);
      }

      // Cancelar cualquier owner_request pendiente del usuario
      await supabase
        .from("owner_requests")
        .delete()
        .eq("user_id", existingUser.id)
        .eq("status", "pending");

      // Notificación in-app
      const notificationMessage = `Ya podés trabajar en "${storeInfo?.name ?? "tu tienda"}" como ${role}. ¡Accedé ahora!`;
      const { error: notificationError } = await supabase.from("Notification").insert({
        userID: existingUser.id,
        mensaje: notificationMessage,
        link: "/",
      });
      if (notificationError) {
        console.error("No se pudo guardar la notificación de invitación:", notificationError);
      } else {
        await sendPushToUser(existingUser.id, {
          title: "Te agregaron a una tienda",
          body: notificationMessage,
          link: "/",
        });
      }

      // Audit log
      await supabase.from("audit_log").insert({
        store_id,
        user_id: user.id,
        store_role: self.store_role,
        action: "member.invite_direct", // distingue del flujo por email
        entity: "store_members",
        entity_id: existingUser.id,
        payload: { email, role, user_existed: true },
      });

      // Email de bienvenida
      await sendInviteEmail({
        to: email,
        storeName: storeInfo?.name ?? "tu tienda",
        role,
        storeId: store_id,
      });

      return NextResponse.json({ message: "Usuario agregado a la tienda" });
    }

    // Audit log
    await supabase.from("audit_log").insert({
      store_id,
      user_id: user.id,
      store_role: self.store_role,
      action: "member.invite",
      entity: "team_invites",
      entity_id: email,
      payload: { email, role, user_existed: false },
    });

    // Email de invitación
    await sendInviteEmail({
      to: email,
      storeName: storeInfo?.name ?? "tu tienda",
      role,
      storeId: store_id,
    });

    return NextResponse.json({ message: "Invitación enviada" });
  } catch (e) {
    return err(e.message, 500);
  }
}

// PATCH — cambiar rol de un miembro
export async function PATCH(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { member_id, store_role } = await request.json();

    if (!member_id || !store_role) return err("Faltan campos");
    if (!["admin", "editor", "analyst", "support"].includes(store_role)) {
      return err("Rol inválido");
    }

    const { data: target, error: targetError } = await supabase
      .from("store_members")
      .select("store_id, store_role, user_id, active")
      .eq("id", member_id)
      .maybeSingle();

    if (targetError) return err(targetError.message, 500);
    if (!target) return err("Miembro no encontrado", 404);
    if (!target.active) return err("Miembro inactivo", 400);
    if (target.store_role === "owner")
      return err("No se puede modificar al owner", 403);

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", target.store_id)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self || !["owner", "admin"].includes(self.store_role)) {
      return err("Sin permisos", 403);
    }

    const allowed = ASSIGNABLE_BY_ROLE[self.store_role] ?? [];
    if (!allowed.includes(store_role))
      return err("No podés asignar ese rol", 403);

    const { error } = await supabase
      .from("store_members")
      .update({ store_role })
      .eq("id", member_id);

    if (error) return err(error.message, 500);

    await supabase.from("audit_log").insert({
      store_id: target.store_id,
      user_id: user.id,
      store_role: self.store_role,
      action: "member.role_change",
      entity: "store_members",
      entity_id: String(member_id),
      payload: { old_role: target.store_role, new_role: store_role },
    });

    return NextResponse.json({ message: "Rol actualizado" });
  } catch (e) {
    return err(e.message, 500);
  }
}

// DELETE — eliminar miembro o desvincularse
export async function DELETE(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member_id");
    const storeId = searchParams.get("store_id");

    if (!memberId && !storeId) return err("member_id o store_id requerido");

    let targetMemberId = memberId;

    // Autodesvinculación: solo viene store_id
    if (!memberId && storeId) {
      const { data: userMember, error: userMemberError } = await supabase
        .from("store_members")
        .select("id")
        .eq("store_id", storeId)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (userMemberError) return err(userMemberError.message, 500);
      if (!userMember) return err("No sos miembro de esta tienda", 404);

      targetMemberId = userMember.id;
    }

    const { data: target, error: targetError } = await supabase
      .from("store_members")
      .select("store_id, store_role, user_id, active")
      .eq("id", targetMemberId)
      .maybeSingle();

    if (targetError) return err(targetError.message, 500);
    if (!target) return err("Miembro no encontrado", 404);
    if (!target.active) return err("Miembro ya estaba inactivo", 400);
    if (target.store_role === "owner")
      return err("El owner no puede desvincularse", 403);

    // Si no se elimina a sí mismo, verificar permisos
    if (target.user_id !== user.id) {
      const { data: self, error: selfError } = await supabase
        .from("store_members")
        .select("store_role")
        .eq("store_id", target.store_id)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (selfError) return err(selfError.message, 500);
      if (!self || !["owner", "admin"].includes(self.store_role)) {
        return err("Sin permisos", 403);
      }
    }

    const { error: deactivateError } = await supabase
      .from("store_members")
      .delete()
      .eq("id", targetMemberId);

    if (deactivateError) return err(deactivateError.message, 500);

    // Si el usuario no tiene más membresías activas, volver a rol "user"
    const { data: remaining } = await supabase
      .from("store_members")
      .select("id")
      .eq("user_id", target.user_id)
      .eq("active", true);

    if (!remaining?.length) {
      await supabase
        .from("user")
        .update({ role: "user" })
        .eq("id", target.user_id);
    }

    const isSelf = target.user_id === user.id;

    await supabase.from("audit_log").insert({
      store_id: target.store_id,
      user_id: isSelf ? target.user_id : user.id,
      store_role: target.store_role,
      action: isSelf ? "member.self_remove" : "member.remove",
      entity: "store_members",
      entity_id: String(targetMemberId),
      payload: { removed_user: target.user_id },
    });

    return NextResponse.json({
      message: isSelf ? "Te desvinculaste de la tienda" : "Miembro eliminado",
    });
  } catch (e) {
    return err(e.message, 500);
  }
}
