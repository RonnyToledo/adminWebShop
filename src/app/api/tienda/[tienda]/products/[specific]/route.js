import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import cloudinary from "@/lib/cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import { cookies } from "next/headers"; // Importar cookies desde headers

export async function GET(request, { params }) {
  await LogUser();
  const { tienda, specific } = await params;
  const { data } = await supabase
    .from(tienda)
    .select("*")
    .eq("productId", specific);

  return NextResponse.json(...new Set(data));
}
export async function POST(request, { params }) {
  await LogUser();
  const { specific } = await params;

  const data = await request.formData();
  const { data: tienda, error } = await supabase
    .from("Products")
    .update([
      {
        coment: data.get("comentario"),
      },
    ])
    .select("*")
    .eq("productId", specific);
  if (error) {
    console.error(error);

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
      console.info("Eliminando imagen antigua");

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
          console.info("Imagen eliminada");
        }
      });
    }
    console.info("salto la eliminacion");

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
    if (res.secure_url) console.info("Imagen creada");

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
      console.error("Error", error);

      return NextResponse.json(
        { message: error },
        {
          status: 402,
        }
      );
    }
    return NextResponse.json(tienda);
  } else {
    console.info("estamos aca");
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
      console.error(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
    console.info("Tarea completada");
    return NextResponse.json(tienda);
  }
}
export async function DELETE(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const imageOld = data.get("image");
  const Id = data.get("Id");
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
        console.info("Imagen eliminada");
      }
    });
  }
  const { data: tienda, error } = await supabase
    .from("Products")
    .delete()
    .eq("productId", Id);
  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
  console.info("Tarea completada");
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
  if (parsedCookie.access_token && parsedCookie.refresh_token)
    console.info("Token recividos");
  else console.error("Token no encontrado");
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};
