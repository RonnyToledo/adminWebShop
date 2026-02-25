import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { LogUser } from "@/lib/logUser";

export async function POST(request, { params }) {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status },
    );
  }
  const { tienda, specific } = await params;

  const data = await request.formData();
  const nombre = data.get("nombre");
  const valor = data.get("valor");
  const cantidad = data.get("cantidad");

  try {
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
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status },
    );
  }
  const { tienda, specific } = await params;

  const data = await request.formData();
  const nombre = data.get("nombre");
  const valor = data.get("valor");
  const cantidad = data.get("cantidad");

  try {
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
