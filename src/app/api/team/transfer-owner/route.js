import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

function err(message, status = 400) {
  return NextResponse.json({ error: true, message }, { status });
}

export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const storeId = new URL(request.url).searchParams.get("store_id");
    if (!storeId) return err("store_id requerido");

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("store_role")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (selfError) return err(selfError.message, 500);
    if (!self || self.store_role !== "owner") {
      return err("Solo el owner actual puede consultar esta operación", 403);
    }

    const { data: members, error } = await supabase
      .from("store_members")
      .select("id, user_id, store_role, active, user:user_id(id, name, email)")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) return err(error.message, 500);
    return NextResponse.json({
      members: (members ?? []).filter(
        (member) => member.store_role !== "owner",
      ),
    });
  } catch (error) {
    return err(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const body = await request.json();
    const storeId = body.store_id;
    const targetUserId = body.target_user_id;
    const confirmation = String(body.confirmation ?? "");

    if (!storeId || !targetUserId || confirmation !== "TRANSFERIR") {
      return err("Confirmación o datos de transferencia inválidos");
    }

    const { data: self, error: selfError } = await supabase
      .from("store_members")
      .select("id, store_role")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    if (selfError) return err(selfError.message, 500);
    if (!self || self.store_role !== "owner")
      return err("Solo el owner actual puede transferir la tienda", 403);

    const { data: target, error: targetError } = await supabase
      .from("store_members")
      .select("id, user_id, store_role, active")
      .eq("store_id", storeId)
      .eq("user_id", targetUserId)
      .eq("active", true)
      .maybeSingle();
    if (targetError) return err(targetError.message, 500);
    if (!target || target.store_role === "owner")
      return err(
        "El destinatario debe ser un miembro activo que no sea owner",
        400,
      );

    const { data: store, error: storeError } = await supabase
      .from("Sitios")
      .select("UUID, Editor, name")
      .eq("UUID", storeId)
      .maybeSingle();
    if (storeError || !store)
      return err(storeError?.message ?? "Tienda no encontrada", 404);

    const { error: oldMemberError } = await supabase
      .from("store_members")
      .update({ store_role: "admin" })
      .eq("id", self.id);
    if (oldMemberError) return err(oldMemberError.message, 500);

    const { error: newMemberError } = await supabase
      .from("store_members")
      .update({ store_role: "owner" })
      .eq("id", target.id);
    if (newMemberError) return err(newMemberError.message, 500);

    const { error: storeUpdateError } = await supabase
      .from("Sitios")
      .update({ Editor: targetUserId })
      .eq("UUID", storeId);
    if (storeUpdateError) return err(storeUpdateError.message, 500);

    const { error: userUpdateError } = await supabase
      .from("user")
      .update({ role: "manager", owner_aproved: true })
      .eq("id", targetUserId);
    if (userUpdateError) return err(userUpdateError.message, 500);

    const { error: auditError } = await supabase.from("audit_log").insert({
      store_id: storeId,
      user_id: user.id,
      store_role: "owner",
      action: "owner.transfer",
      entity: "Sitios",
      entity_id: storeId,
      payload: {
        store_name: store.name,
        previous_owner_id: user.id,
        new_owner_id: targetUserId,
      },
    });
    if (auditError) return err(auditError.message, 500);

    await supabase.from("Notification").insert({
      userID: targetUserId,
      mensaje: `Ahora eres owner de la tienda: ${store.name}`,
      link: "/",
    });

    return NextResponse.json({
      message: "Propiedad transferida correctamente",
      store_id: storeId,
      owner_id: targetUserId,
    });
  } catch (error) {
    return err(error.message, 500);
  }
}
