import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import cloudinary from "@/lib/cloudinary";

export async function GET(request, { params }) {
  const supabase = createClient();
  const { data: tienda } = await supabase.from("Products").select("*");
  return NextResponse.json(tienda);
}

export async function POST(request, { params }) {
  const supabase = createClient();
  const data = await request.formData();
  const image = data.get("image");
  const Ui = data.get("UID");
  const { data: a, error1 } = await supabase.from("Products").select("id");
  const arrayOfNumbers = a.map((obj) => obj.id);
  if (error1) {
    return NextResponse.json(
      { message: "Fallo al primer paso" },
      {
        status: 400,
      }
    );
  }

  function findFirstMissingValue(arr) {
    let i = 0; // Iniciar desde 0
    while (true) {
      if (!arr.includes(i)) {
        return i; // Retorna el primer valor que no está en el array
      }
      i++; // Incrementar el valor a verificar
    }
  }
  if (image) {
    const byte = await image.arrayBuffer();
    const buffer = Buffer.from(byte);
    const res = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        })
        .end(buffer);
    });
    const { data: tienda, error } = await supabase
      .from("Products")
      .insert([
        {
          id: findFirstMissingValue(arrayOfNumbers),
          title: data.get("title"),
          price: data.get("price"),
          caja: data.get("caja"),
          favorito: data.get("favorito"),
          descripcion: data.get("descripcion"),
          image: res.secure_url,
          storeId: Ui,
          creado: data.get("creado"),
        },
      ])
      .select();
    if (error) {
      console.log(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
    console.log(tienda);
    return NextResponse.json(tienda);
  } else {
    const { data: tienda, error } = await supabase
      .from("Products")
      .insert([
        {
          id: findFirstMissingValue(arrayOfNumbers),
          title: data.get("title"),
          price: data.get("price"),
          caja: data.get("caja"),
          favorito: data.get("favorito"),
          descripcion: data.get("descripcion"),
          storeId: Ui,
          creado: data.get("creado"),
        },
      ])
      .select();
    if (error) {
      console.log(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
    console.log(tienda);
    return NextResponse.json(tienda);
  }
}
export async function PUT(request, { params }) {
  const supabase = createClient();
  const data = await request.formData();
  const products = JSON.parse(data.get("products"));

  try {
    // Actualiza los productos usando Promise.all para paralelismo
    await Promise.all(
      products.map(async (product) => {
        const { productId, agotado, order } = product;
        const { error: productError } = await supabase
          .from("Products")
          .update({ agotado: agotado, order: order })
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
