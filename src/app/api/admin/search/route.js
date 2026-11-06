import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { can } from "@/lib/permissions";

const MAX_QUERY_LENGTH = 80;
const MAX_RESULTS_PER_TYPE = 8;

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET(request) {
  try {
    const { supabase, user } = await requireRouteUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const storeId = searchParams.get("storeId")?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({ products: [], categories: [] });
    }
    if (query.length > MAX_QUERY_LENGTH || !storeId) {
      return NextResponse.json(
        { message: "La búsqueda no es válida." },
        { status: 400 },
      );
    }

    let { data: membership, error: membershipError } = await supabase
      .from("store_members")
      .select("store_id, store_role")
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .eq("active", true)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { message: "No se pudo validar el acceso a la tienda." },
        { status: 500 },
      );
    }

    if (!membership) {
      const { data: legacyStore, error } = await supabase
        .from("Sitios")
        .select("UUID")
        .eq("UUID", storeId)
        .eq("Editor", user.id)
        .maybeSingle();
      if (error) {
        return NextResponse.json(
          { message: "No se pudo validar el acceso a la tienda." },
          { status: 500 },
        );
      }
      if (legacyStore) {
        membership = { store_id: legacyStore.UUID, store_role: "owner" };
      }
    }

    if (!membership || !can(membership.store_role, "write")) {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    const pattern = `%${escapeLike(query)}%`;
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("Products")
        .select("productId, title")
        .eq("storeId", membership.store_id)
        .ilike("title", pattern)
        .limit(MAX_RESULTS_PER_TYPE),
      supabase
        .from("categorias")
        .select("id, name")
        .eq("storeId", membership.store_id)
        .ilike("name", pattern)
        .limit(MAX_RESULTS_PER_TYPE),
    ]);

    if (productsResult.error || categoriesResult.error) {
      console.error("Error en búsqueda global del Admin:", {
        products: productsResult.error?.message,
        categories: categoriesResult.error?.message,
      });
      return NextResponse.json(
        { message: "No se pudieron buscar productos y categorías." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      products: productsResult.data ?? [],
      categories: categoriesResult.data ?? [],
    });
  } catch (error) {
    console.error("Error en búsqueda global del Admin:", error);
    return NextResponse.json(
      { message: "No se pudo completar la búsqueda." },
      { status: 500 },
    );
  }
}
