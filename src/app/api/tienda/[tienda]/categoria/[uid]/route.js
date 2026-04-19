import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import { requireRouteUser } from "@/lib/route-handler-auth";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function GET(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { tienda, specific } = await params;
    const { data } = await supabase
      .from(tienda)
      .select("*")
      .eq("productId", specific);

    return NextResponse.json(...new Set(data));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const data = await request.formData();
    const object = formDataToObject(data);

    // Si tenemos nueva imagen
    if (object.newImage && object.newImage !== "undefined") {
      // Verificar si newImage es un archivo válido
      if (object.newImage instanceof File || object.newImage instanceof Blob) {
        // Eliminar imagen vieja si existe
        if (object.image) {
          console.info("Destruyendo imagen antigua");

          const publicId = extractPublicId(object.image);
          // Usar Promise para manejar cloudinary correctamente
          await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
              if (error) {
                console.error("Error eliminando imagen:", error);
                reject(error);
              } else {
                console.info("Imagen eliminada:", result);
                resolve(result);
              }
            });
          });
        }
        console.info("No hay imagen a eliminar");

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

        console.info("Nueva iamgen: ", res.secure_url);
        delete object.newImage;

        // Subimos a la BD los datos
        const { data: tienda, error } = await supabase
          .from("categorias")
          .update({ ...object, image: res.secure_url })
          .eq("id", object.id)
          .select("*")
          .single();

        if (error) {
          console.error("Error", error);
          return NextResponse.json({ message: error.message || error }, { status: 400 });
        }
        return NextResponse.json(tienda);
      } else {
        console.error("newImage no es un archivo válido.");
        return NextResponse.json(
          { message: "newImage no es un archivo válido." },
          { status: 400 },
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
        console.error(error);
        return NextResponse.json({ message: error.message || error }, { status: 400 });
      }
      console.info("Tarea ejecutada");
      return NextResponse.json(tienda);
    }
  } catch (error) {
    console.error("Error en la actualización:", error);
    return NextResponse.json(
      { message: error.message || "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const data = await request.formData();
    const imageOld = data.get("image");
    const Id = data.get("Id");
    console.info("Id: ", Id);
    
    if (imageOld) {
      const publicId = extractPublicId(imageOld);
      // Usar Promise para manejar cloudinary correctamente
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error eliminando imagen:", error);
            reject(error);
          } else {
            console.info("Imagen eliminada");
            resolve(result);
          }
        });
      });
    }
    
    const { data: tienda, error } = await supabase
      .from("Products")
      .delete()
      .eq("productId", Id);
    if (error) {
      console.error(error);

      return NextResponse.json(
        { message: error.message || error },
        {
          status: 400,
        },
      );
    }
    console.info("Tarea ejecutada");
    return NextResponse.json(tienda);
  } catch (error) {
    console.error("Error en la eliminación:", error);
    return NextResponse.json(
      { message: error.message || "Error desconocido" },
      { status: 500 },
    );
  }
}
