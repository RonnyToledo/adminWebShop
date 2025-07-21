import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
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
  console.log(parsedCookie.access_token, parsedCookie.refresh_token);
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function GET(request, { params }) {
  await LogUser();

  const { data: tienda } = await supabase.from("Products").select("*");
  return NextResponse.json(tienda);
}

export async function POST(request, { params }) {
  await LogUser();

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
          span: data.get("span"),
          image: res.secure_url,
          storeId: Ui,
          creado: data.get("creado"),
        },
      ])
      .select("*, agregados (*)");
    if (error) {
      console.error(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
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
          span: data.get("span"),
          storeId: Ui,
          creado: data.get("creado"),
        },
      ])
      .select("*, agregados (*)");
    if (error) {
      console.error(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
    return NextResponse.json(tienda);
  }
}
export async function PUT(request, { params }) {
  const data = await request.formData();
  const products = JSON.parse(data.get("products"));
  console.log(products);
  try {
    await updateProductsInBatches(products, 10);

    return NextResponse.json({
      message: "Productos actualizados correctamente.",
    });
  } catch (error) {
    console.error("Error en la actualización:", error);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}

async function updateProductsInBatches(products, batchSize = 10) {
  await LogUser();

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (product) => {
        const { productId, agotado, order, title, caja, visible } = product;
        const { data: prod, error } = await supabase
          .from("Products")
          .update({ agotado, order, caja, visible })
          .eq("productId", productId)
          .select("*");
        console.log(prod);
        if (error) {
          console.error(
            `Error al actualizar el producto ${title}: ${error.message}`
          );
          throw new Error(
            `Error actualizando producto ${title}: ${error.message}`
          );
        }
      })
    );
  }
}
