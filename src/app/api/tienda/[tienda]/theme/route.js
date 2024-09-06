import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function PUT(request, { params }) {
  const supabase = createClient();
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
    console.log(error);
    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}