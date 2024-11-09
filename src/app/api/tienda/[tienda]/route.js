import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";
import { cookies } from "next/headers"; // Importar cookies desde headers

const LogUser = async () => {
  const cookie = cookies().get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};
export async function GET(request, { params }) {
  await LogUser();

  const { data: tiendaData } = await supabase
    .from("Sitios")
    .select(
      `*, Products (*, agregados (*), coment (*)),codeDiscount (*),comentTienda(*)`
    )
    .eq("sitioweb", params.tienda)
    .single("*");

  const storeData = {
    ...tiendaData,
    moneda: JSON.parse(tiendaData.moneda),
    moneda_default: JSON.parse(tiendaData.moneda_default),
    horario: JSON.parse(tiendaData.horario),
    categoria: JSON.parse(tiendaData.categoria),
    envios: JSON.parse(tiendaData.envios),
    products: tiendaData.Products,
    top: tiendaData.name,
  };
  delete storeData.Products;
  return NextResponse.json(storeData);
}

export async function PUT(request, { params }) {
  const data = await request.formData();
  const storeObject = formDataToObject(data);
  delete storeObject.Events;
  delete storeObject.codeDiscount;
  if (storeObject?.urlPosterNew) {
    if (storeObject?.urlPoster) {
      const publicId = extractPublicId(storeObject?.urlPoster);
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
          console.info("Imagen eliminada:", result);
        }
      });
    }
    const byte = await storeObject.urlPosterNew.arrayBuffer();
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
    //Preparando nueva Imagen
    delete storeObject.urlPosterNew;

    await RefreshSupabase(
      {
        ...storeObject,
        urlPoster: res.secure_url,
        envios: storeObject.envios.map((obj) => {
          return { nombre: obj.nombre, municipios: obj.municipios };
        }),
      },

      params.tienda
    );
  } else {
    await RefreshSupabase(
      {
        ...storeObject,
        envios: storeObject.envios.map((obj) => {
          return { nombre: obj.nombre, municipios: obj.municipios };
        }),
      },
      params.tienda
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}

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

async function RefreshSupabase(object, eq) {
  await LogUser();
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update(object)
    .eq("sitioweb", eq)
    .select();
  if (error) {
    console.error(error);
    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
}
