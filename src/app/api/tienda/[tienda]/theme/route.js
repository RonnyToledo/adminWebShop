import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { LogUser } from "@/lib/logUser";

export async function PUT(request, { params }) {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status },
    );
  }

  const data = await request.formData();
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([
      {
        variable: data.get("variable"),
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
      },
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}
