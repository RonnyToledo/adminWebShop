import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";
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
  const tienda = (await params).tienda;
  const data = await request.formData();
  const storeObject = formDataToObject(data);
  let res1;
  let res2;
  delete storeObject.Events;
  delete storeObject.codeDiscount;
  if (storeObject?.urlPosterNew) {
    if (storeObject?.urlPoster) {
      await DeleteImage(storeObject.urlPoster);
    }
    res1 = await UploadImage(storeObject.urlPosterNew);
    console.log(res1);
    //Preparando nueva Imagen
    if (res1) delete storeObject.urlPosterNew;
  }
  if (storeObject?.bannerNew) {
    if (storeObject?.banner) {
      await DeleteImage(storeObject.banner);
    }
    res2 = await UploadImage(storeObject.bannerNew);
    console.log(res2);

    //Preparando nueva Imagen
    if (res2) delete storeObject.bannerNew;
  }
  await RefreshSupabase(
    {
      ...storeObject,
      banner: res2?.secure_url || storeObject.banner,
      urlPoster: res1?.secure_url || storeObject.urlPoster,
      envios: storeObject.envios.map((obj) => {
        return { nombre: obj.nombre, municipios: obj.municipios };
      }),
    },
    tienda
  );
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
async function DeleteImage(image) {
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
      console.info("Imagen eliminada:", result);
    }
  });
}
async function UploadImage(image) {
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
  return res;
}
