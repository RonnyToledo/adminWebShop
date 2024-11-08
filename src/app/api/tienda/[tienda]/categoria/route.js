import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
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

async function updateProductsInBatches(products, batchSize = 10) {
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    // Procesa cada lote con Promise.all para paralelismo dentro del lote
    await Promise.all(
      batch.map(async (product) => {
        const { productId, caja } = product;

        // Intento de actualización en la tabla "Products"
        const { error } = await supabase
          .from("Products")
          .update({ caja })
          .eq("productId", productId);

        // Si hay un error en la actualización, lo lanza
        if (error) {
          console.error(
            `Error al actualizar el producto ${productId}: ${error.message}`
          );
          throw new Error(
            `Error actualizando producto ${productId}: ${error.message}`
          );
        }
      })
    );
  }
}

export async function POST(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const categoria = data.get("categoria");
  const products = JSON.parse(data.get("products"));

  try {
    // Actualiza la categoría de la tienda
    const { error: tiendaError } = await supabase
      .from("Sitios")
      .update({ categoria })
      .eq("sitioweb", params.tienda);

    if (tiendaError) {
      return handleError(tiendaError);
    }

    // Llama a la función para actualizar productos en lotes
    await updateProductsInBatches(products, 10);

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
