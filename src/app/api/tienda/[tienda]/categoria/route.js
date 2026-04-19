import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function POST(request, { params }) {
  // Obtenemos el cuerpo enviado desde el cliente
  const data = await request.json();
  if (data) console.info(data);
  try {
    // Obtener cliente autenticado
    const supabase = await getAuthenticatedSupabase();

    const { data: newData, error: tiendaError } = await supabase
      .from("categorias")
      .insert([data])
      .select("*")
      .single();

    if (tiendaError) {
      console.error(
        `Error al actualizar el producto ${cat.name}: ${tiendaError}`,
      );
      throw new Error(
        `Error actualizando producto ${cat.name}: ${tiendaError.message}`,
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
      { status: 500 },
    );
  }
}
export async function PUT(request, { params }) {
  const data = await request.formData();
  const categoria = JSON.parse(data.get("categoria"));
  const UUID = data.get("UUID");
  if (categoria) console.info("Categoria recivida");
  try {
    // Obtener cliente autenticado
    const supabase = await getAuthenticatedSupabase();

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
            `Error al actualizar el producto ${cat.id}: ${tiendaError.message}`,
          );
          throw new Error(
            `Error actualizando producto ${cat.id}: ${tiendaError.message}`,
          );
        }
      }),
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
      { status: 500 },
    );
  }
}

function handleError(error) {
  console.error(error);
  return NextResponse.json(
    { message: error.message || "Ocurrió un error desconocido" },
    { status: 400 },
  );
}

export async function DELETE(request, { params }) {
  // Obtenemos el cuerpo enviado desde el cliente
  const { UUID, image } = await request.json();
  try {
    // Obtener cliente autenticado
    const supabase = await getAuthenticatedSupabase();

    if (image) {
      const publicId = extractPublicId(image);
      try {
        await new Promise((resolve, reject) => {
          cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) reject(error);
            else {
              console.info("Imagen eliminada:", result);
              resolve(result);
            }
          });
        });
      } catch (error) {
        console.error("Error eliminando imagen:", error);
        return NextResponse.json(
          { message: error.message || error },
          { status: 400 },
        );
      }
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
        `Error al actualizar el producto ${cat.id}: ${tiendaError.message}`,
      );
      throw new Error(
        `Error actualizando producto ${cat.id}: ${tiendaError.message}`,
      );
    }

    return NextResponse.json({
      message: "Categoría y productos actualizados correctamente.",
    });
  } catch (error) {
    console.error("Error en la actualización:", error.message);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 },
    );
  }
}
