import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers

const LogUser = async () => {
  const cookie = (await cookies()).get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  if (parsedCookie.access_token && parsedCookie.refresh_token)
    console.info("Token recividos");
  else console.error("Token no encontrado");
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function POST(request, { params }) {
  await LogUser();
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
      { status: 500 }
    );
  }
}
export async function DELETE(request, { params }) {
  await LogUser();
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
      { status: 500 }
    );
  }
}

function handleError(error) {
  console.error(error);
  return NextResponse.json(
    { message: error.message || "Ocurrió un error desconocido" },
    { status: 400 }
  );
}
