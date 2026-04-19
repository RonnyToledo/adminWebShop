import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function POST(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const data = await request.formData();
    const { data: tienda, error } = await supabase
      .from("Sitios")
      .update([
        {
          color: data.get("color"),
        },
      ])
      .select()
      .eq("sitioweb", params.tienda);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { message: error.message || error },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({ message: "Producto creado" });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}
