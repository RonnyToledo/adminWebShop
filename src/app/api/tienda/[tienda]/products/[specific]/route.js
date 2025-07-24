import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import cloudinary from "@/lib/cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import { cookies } from "next/headers"; // Importar cookies desde headers

export async function GET(request, { params }) {
  await LogUser();

  const { data: tienda } = await supabase
    .from(params.tienda)
    .select("*")
    .eq("productId", params.specific);

  return NextResponse.json(...new Set(tienda));
}
export async function POST(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const { data: tienda, error } = await supabase
    .from("Products")
    .update([
      {
        coment: data.get("comentario"),
      },
    ])
    .select("*")
    .eq("productId", params.specific);
  if (error) {
    console.log(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
  return NextResponse.json({ message: "Comentario realizado" });
}

export async function PUT(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const Id = data.get("Id");
  const newImage = data.get("newImage");
  const image = data.get("image");
  //Si tenemos imagen nueva
  if (newImage) {
    //Eliminamos la vieja
    if (image) {
      console.log("Acaso estas aqui");

      const publicId = extractPublicId(image);
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Error eliminando imagen:", error);

          return NextResponse.json(
            { message: error },
            {
              status: 401,
            }
          );
        } else {
          console.log("Imagen eliminada:", result);
        }
      });
    }
    console.log("salto la eliminacion");

    //Subimos la nueva
    const byte = await newImage.arrayBuffer();
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
    console.log(res.secure_url);

    //Subimos a la BD los datos
    const { data: tienda, error } = await supabase
      .from("Products")
      .update({
        title: data.get("title"),
        descripcion: data.get("descripcion"),
        price: data.get("price"),
        order: data.get("order"),
        caja: data.get("caja"),
        favorito: data.get("favorito"),
        agotado: data.get("agotado"),
        visible: data.get("visible"),
        oldPrice: data.get("oldPrice"),
        span: data.get("span"),
        image: res.secure_url,
      })
      .eq("productId", Id)
      .select("*");
    if (error) {
      console.log("Error", error);

      return NextResponse.json(
        { message: error },
        {
          status: 402,
        }
      );
    }
    return NextResponse.json(tienda);
  } else {
    console.log("estamos aca");
    console.log(Id);
    //Si no tenemos nueva Imagen solo actualizamos los datos
    const { data: tienda, error } = await supabase
      .from("Products")
      .update({
        title: data.get("title"),
        descripcion: data.get("descripcion"),
        price: data.get("price"),
        order: data.get("order"),
        caja: data.get("caja"),
        favorito: data.get("favorito"),
        agotado: data.get("agotado"),
        visible: data.get("visible"),
        span: data.get("span"),
        oldPrice: data.get("oldPrice"),
      })
      .select("*")
      .eq("productId", Id);
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
export async function DELETE(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const imageOld = data.get("image");
  const Id = data.get("Id");
  console.log(Id);
  if (imageOld) {
    const publicId = extractPublicId(imageOld);
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Error eliminando imagen:", error);

        return NextResponse.json(
          { message: error },
          {
            status: 402,
          }
        );
      } else {
        console.log("Imagen eliminada:", result);
      }
    });
  }
  const { data: tienda, error } = await supabase
    .from("Products")
    .delete()
    .eq("productId", Id);
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
