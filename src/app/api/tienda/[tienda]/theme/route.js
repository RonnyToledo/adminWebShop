import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

export async function PUT(request, { params }) {
  let supabase;
  try {
    ({ supabase } = await requireRouteUser());
  } catch {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
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
      { message: error.message || error },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}
