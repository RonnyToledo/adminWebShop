///api/team/invites

import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

function err(msg, status = 400) {
  return NextResponse.json({ error: true, message: msg }, { status });
}

const VALID_ROLES = ["admin", "editor", "analyst", "support"];

// GET — listar invitaciones pendientes
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

    const { data: invites, error } = await supabase
      .from("team_invites")
      .select("id, store_id, email, role, status, created_at, responded_at")
      .eq("store_id", storeId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return err(error.message, 500);

    return NextResponse.json({ invites });
  } catch (e) {
    return err(e.message, 500);
  }
}

// DELETE — eliminar invitación pendiente
export async function DELETE(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("invite_id");

    if (!inviteId) return err("invite_id requerido");

    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("id, store_id, email, role, status, invited_by")
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteError) return err(inviteError.message, 500);
    if (!invite) return err("Invitación no encontrada", 404);
    if (invite.status !== "pending")
      return err("Solo se pueden eliminar invitaciones pendientes", 400);

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", invite.store_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self || !["owner", "admin"].includes(self.store_role)) {
      return err("Sin permisos para eliminar invitaciones", 403);
    }

    const { error: deleteError } = await supabase
      .from("team_invites")
      .delete()
      .eq("id", inviteId);

    if (deleteError) return err(deleteError.message, 500);

    await supabase.from("audit_log").insert({
      store_id: invite.store_id,
      user_id: user.id,
      store_role: self.store_role,
      action: "invite.delete",
      entity: "team_invites",
      entity_id: String(inviteId),
      payload: { email: invite.email, role: invite.role },
    });

    return NextResponse.json({ message: "Invitación eliminada" });
  } catch (e) {
    return err(e.message, 500);
  }
}

// PATCH — cambiar rol de invitación pendiente
export async function PATCH(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { invite_id, store_role } = await request.json();

    if (!invite_id || !store_role) return err("Faltan campos");
    if (!VALID_ROLES.includes(store_role)) return err("Rol inválido");

    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("id, store_id, email, role, status")
      .eq("id", invite_id)
      .maybeSingle();

    if (inviteError) return err(inviteError.message, 500);
    if (!invite) return err("Invitación no encontrada", 404);
    if (invite.status !== "pending")
      return err("Solo se pueden editar invitaciones pendientes", 400);

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", invite.store_id)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self || !["owner", "admin"].includes(self.store_role)) {
      return err("Sin permisos", 403);
    }

    if (self.store_role === "admin" && ["admin"].includes(store_role)) {
      return err("No podés asignar ese rol", 403);
    }

    const { error: updateError } = await supabase
      .from("team_invites")
      .update({ role: store_role })
      .eq("id", invite_id);

    if (updateError) return err(updateError.message, 500);

    await supabase.from("audit_log").insert({
      store_id: invite.store_id,
      user_id: user.id,
      store_role: self.store_role,
      action: "invite.role_change",
      entity: "team_invites",
      entity_id: String(invite_id),
      payload: {
        email: invite.email,
        old_role: invite.role,
        new_role: store_role,
      },
    });

    return NextResponse.json({ message: "Rol de invitación actualizado" });
  } catch (e) {
    return err(e.message, 500);
  }
}
