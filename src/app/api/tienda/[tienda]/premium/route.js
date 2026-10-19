//.\app\api\tienda\[tienda]\premium\route.js

import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

function handleError(error, status = 400) {
  console.error(error);
  const message = error?.message || "Ocurrió un error desconocido";
  // El RPC lanza "No autorizado" cuando el usuario no es owner/admin de la tienda
  const isAuthError = message.includes("No autorizado");
  return NextResponse.json({ message }, { status: isAuthError ? 403 : status });
}

// GET /api/tienda/[tienda]/premium?storeId=UUID
// GET /api/tienda/[tienda]/premium?storeId=UUID&q=busqueda  -> busca clientes candidatos
export async function GET(request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const q = searchParams.get("q");

    if (!storeId) {
      return NextResponse.json({ message: "Falta storeId" }, { status: 400 });
    }

    if (q && q.trim().length >= 2) {
      const { data, error } = await supabase.rpc("search_store_customers", {
        p_store_id: storeId,
        p_search: q.trim(),
      });
      if (error) return handleError(error);
      return NextResponse.json({ data });
    }

    const { data, error } = await supabase.rpc("get_premium_members", {
      p_store_id: storeId,
    });
    if (error) return handleError(error);

    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error, 500);
  }
}

// POST /api/tienda/[tienda]/premium  { storeId, userId }
export async function POST(request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { storeId, userId } = await request.json();

    if (!storeId || !userId) {
      return NextResponse.json(
        { message: "Faltan storeId o userId" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("add_premium_member", {
      p_store_id: storeId,
      p_user_id: userId,
    });
    if (error) return handleError(error);

    return NextResponse.json({
      message: "Cliente agregado como Premium",
      data,
    });
  } catch (error) {
    return handleError(error, 500);
  }
}

// PATCH /api/tienda/[tienda]/premium  { storeId, userId, active }
export async function PATCH(request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { storeId, userId, active } = await request.json();

    if (!storeId || !userId || typeof active !== "boolean") {
      return NextResponse.json(
        { message: "Faltan storeId, userId o active" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("set_premium_member_status", {
      p_store_id: storeId,
      p_user_id: userId,
      p_active: active,
    });
    if (error) return handleError(error);

    return NextResponse.json({
      message: active ? "Cliente reactivado" : "Cliente desactivado",
      data,
    });
  } catch (error) {
    return handleError(error, 500);
  }
}
