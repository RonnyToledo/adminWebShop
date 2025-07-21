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

export async function PUT(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const object = formDataToObject(data);
  console.log(object);

  // Si tenemos nueva imagen
  if (object.newImage && object.newImage !== "undefined") {
    // Verificar si newImage es un archivo válido
    if (object.newImage instanceof File || object.newImage instanceof Blob) {
      // Eliminar imagen vieja si existe
      if (object.image) {
        console.log("Acaso estas aqui");

        const publicId = extractPublicId(object.image);
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error eliminando imagen:", error);
            return NextResponse.json({ message: error }, { status: 401 });
          } else {
            console.log("Imagen eliminada:", result);
          }
        });
      }
      console.log("Salto la eliminación");

      // Subimos la nueva
      const byte = await object.newImage.arrayBuffer();
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
      delete object.newImage;

      // Subimos a la BD los datos
      const { data: tienda, error } = await supabase
        .from("categorias")
        .update({ ...object, image: res.secure_url })
        .eq("id", object.id)
        .select("*")
        .single();

      if (error) {
        console.log("Error", error);
        return NextResponse.json({ message: error }, { status: 402 });
      }
      return NextResponse.json(tienda);
    } else {
      console.error("newImage no es un archivo válido.");
      return NextResponse.json(
        { message: "newImage no es un archivo válido." },
        { status: 400 }
      );
    }
  } else {
    // Si no hay nueva imagen, solo actualizamos los datos
    delete object.newImage;

    const { data: tienda, error } = await supabase
      .from("categorias")
      .update(object)
      .eq("id", object.id)
      .select("*")
      .single();

    if (error) {
      console.log(error);
      return NextResponse.json({ message: error }, { status: 401 });
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
function formDataToObject(formData) {
  const object = {};

  // Itera sobre todos los pares clave-valor del FormData
  formData.forEach((value, key) => {
    // Si el valor es un archivo (File), lo dejamos tal cual
    if (value instanceof File) {
      object[key] = value;
    } else {
      try {
        // Intentamos parsear el valor como JSON
        object[key] = JSON.parse(value);
      } catch (error) {
        // Si no es JSON, lo asignamos directamente
        object[key] = value;
      }
    }
  });

  return object;
}
