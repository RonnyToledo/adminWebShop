import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers
import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";

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
  // Obtenemos el cuerpo enviado desde el cliente
  const data = await request.json();
  if (data) console.info(data);
  try {
    // Actualiza la categoría de la tienda
    await LogUser();

    const { data: newData, error: tiendaError } = await supabase
      .from("categorias")
      .insert([data])
      .select("*")
      .single();

    if (tiendaError) {
      console.error(
        `Error al actualizar el producto ${cat.id}: ${tiendaError}`
      );
      throw new Error(
        `Error actualizando producto ${cat.id}: ${tiendaError.message}`
      );
    }

    return NextResponse.json({
      message: "Categoría y productos actualizados correctamente.",
      data: newData,
    });
  } catch (error) {
    console.error("Error en la actualización:", error);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}
export async function PUT(request, { params }) {
  const data = await request.formData();
  const categoria = JSON.parse(data.get("categoria"));
  const UUID = data.get("UUID");
  if (categoria) console.info("Categoria recivida");
  try {
    // Actualiza la categoría de la tienda
    await LogUser();

    await Promise.all(
      categoria.map(async (cat) => {
        const { error: tiendaError } = await supabase
          .from("categorias")
          .upsert(cat);

        if (tiendaError) {
          return handleError(tiendaError);
        }

        // Si hay un error en la actualización, lo lanza
        if (tiendaError) {
          console.error(
            `Error al actualizar el producto ${cat.id}: ${tiendaError.message}`
          );
          throw new Error(
            `Error actualizando producto ${cat.id}: ${tiendaError.message}`
          );
        }
      })
    );
    console.info("categorias ok");

    const { data: categoryNew, error: tiendaError } = await supabase
      .from("categorias")
      .select("*")
      .eq("storeId", UUID);

    if (tiendaError) {
      console.error(tiendaError);
    }

    return NextResponse.json({
      message: "Categoría y productos actualizados correctamente.",
      data: categoryNew,
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

export async function DELETE(request, { params }) {
  // Obtenemos el cuerpo enviado desde el cliente
  const { UUID, image } = await request.json();
  try {
    // Actualiza la categoría de la tienda
    await LogUser();
    if (image) {
      const publicId = extractPublicId(image);
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
          console.info("Imagen eliminada:", result);
        }
      });
    }
    const { error: tiendaError } = await supabase
      .from("categorias")
      .delete()
      .eq("id", UUID);

    if (tiendaError) {
      return handleError(tiendaError);
    }

    // Si hay un error en la actualización, lo lanza
    if (tiendaError) {
      console.error(
        `Error al actualizar el producto ${cat.id}: ${tiendaError.message}`
      );
      throw new Error(
        `Error actualizando producto ${cat.id}: ${tiendaError.message}`
      );
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
