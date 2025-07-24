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
  const imageFile = data.get("image");
  const Ui = data.get("UID");

  // 2) Subida a Cloudinary (si hay imagen)
  let imageUrl = null;
  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadRes = await new Promise((res, rej) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (err, result) =>
          err ? rej(err) : res(result)
        )
        .end(buffer);
    });
    imageUrl = uploadRes.secure_url;
  }

  // 3) Llamada RPC
  const { data: newProduct, error } = await supabase
    .rpc("create_product", {
      _title: data.get("title"),
      _price: Number(data.get("price")),
      _caja: data.get("caja"),
      _favorito: data.get("favorito") === "true",
      _descripcion: data.get("descripcion"),
      _span: data.get("span") === "true",
      _image_url: imageUrl,
      _storeid: Ui, // <- CAMBIO AQUÍ
      _creado: data.get("creado"),
    })
    .single();

  if (error) {
    console.error("RPC create_product error:", error);
    return NextResponse.json(
      { message: error.message, details: error.details },
      { status: error.code === "PGRST400" ? 400 : 500 }
    );
  }
  return NextResponse.json(newProduct, { status: 201 });
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
