import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers"; // Importar cookies desde headers

const LogUser = async () => {
  const cookie = cookies().get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  console.log(parsedCookie.access_token, parsedCookie.refresh_token);
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function POST(request, { params }) {
  await LogUser();

  const supabase = createClient();
  const data = await request.formData();
  const categoria = data.get("categoria");
  const products = JSON.parse(data.get("products"));

  try {
    // Actualiza la categoría de la tienda
    const { data: tienda, error: tiendaError } = await supabase
      .from("Sitios")
      .update({ categoria })
      .eq("sitioweb", params.tienda)
      .select();

    if (tiendaError) {
      return handleError(tiendaError);
    }

    // Actualiza los productos usando Promise.all para paralelismo
    await Promise.all(
      products.map(async (product) => {
        const { productId, caja } = product;
        const { error: productError } = await supabase
          .from("Products")
          .update({ caja })
          .eq("productId", productId);

        if (productError) {
          throw new Error(
            `Error actualizando producto ${productId}: ${productError.message}`
          );
        }
      })
    );

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
