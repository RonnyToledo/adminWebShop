import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function POST(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { tienda, specific } = await params;

    const data = await request.formData();
    const nombre = data.get("nombre");
    const valor = data.get("valor");
    const cantidad = data.get("cantidad");

    // Actualiza la categoría de la tienda
    const { data: agg, error: tiendaError } = await supabase
      .from("agregados")
      .insert([{ nombre, valor, cantidad, UID: specific }])
      .select();

    if (tiendaError) {
      return handleError(tiendaError);
    }

    return NextResponse.json({
      message: "Categoría y productos actualizados correctamente.",
      value: agg,
    });
  } catch (error) {
    console.error("Error en la actualización:", error.message);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { specific } = await params;

    const data = await request.formData();
    const nombre = data.get("nombre");
    const valor = data.get("valor");
    const cantidad = data.get("cantidad");

    // Actualiza la categoría de la tienda
    const { data: tienda, error: tiendaError } = await supabase
      .from("Products")
      .update({ nombre, valor, cantidad, UID: specific })
      .eq("productId", specific)
      .select();

    if (tiendaError) {
      return handleError(tiendaError);
    }

    return NextResponse.json({
      message: "Categoría y productos actualizados correctamente.",
    });
  } catch (error) {
    console.error("Error en la actualización:", error.message);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 },
    );
  }
}

function handleError(error) {
  console.error(error);
  return NextResponse.json(
    { message: error.message || "Ocurrió un error desconocido" },
    { status: 400 },
  );
}
