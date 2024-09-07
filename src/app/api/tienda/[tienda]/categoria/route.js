import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request, { params }) {
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
