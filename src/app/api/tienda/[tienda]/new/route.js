import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";

export async function POST(request, { params }) {
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
      { message: error },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}
