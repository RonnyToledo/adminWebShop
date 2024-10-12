import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { extractPublicId } from "cloudinary-build-url";
import cloudinary from "@/lib/cloudinary";
import { cookies } from "next/headers"; // Importar cookies desde headers

export async function GET(request, { params }) {
  const cookie = cookies().get("sb-access-token");
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

  const { data: tienda } = await supabase
    .from("Sitios")
    .select()
    .eq("sitioweb", params.tienda);
  const [a] = tienda;
  const b = {
    ...a,
    categoria: JSON.parse(a.categoria),
    moneda: JSON.parse(a.moneda),
    moneda_default: JSON.parse(a.moneda_default),
    horario: JSON.parse(a.horario),
    comentario: JSON.parse(a.comentario),
    envios: JSON.parse(a.envios),
  };
  return NextResponse.json(b);
}

export async function POST(request, { params }) {
  const cookie = cookies().get("sb-access-token");
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

  const data = await request.formData();
  const image = data.get("urlPosterNew");

  if (image) {
    // Con imagen nueva
    // Eliminando Imagen antigua
    const imageOld = data.get("urlPoster");
    if (imageOld) {
      const publicId = extractPublicId(imageOld);
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
    //Preparando nueva Imagen
    const { data: tienda, error } = await supabase
      .from("Sitios")
      .update([
        {
          name: data.get("name"),
          parrrafo: data.get("parrrafo"),
          horario: data.get("horario"),
          urlPoster: res.secure_url,
        },
      ])
      .eq("sitioweb", params.tienda)
      .select();
    if (error) {
      console.log(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
  } else {
    // Actualizacion sin Imagen

    const { data: tienda, error } = await supabase
      .from("Sitios")
      .update([
        {
          name: data.get("name"),
          parrrafo: data.get("parrrafo"),
          horario: data.get("horario"),
        },
      ])
      .eq("sitioweb", params.tienda)
      .select();
    if (error) {
      console.log(error);

      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
  }

  return NextResponse.json({ message: "Producto creado" });
}
export async function PUT(request, { params }) {
  const data = await request.formData();

  const cookie = cookies().get("sb-access-token");
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

  console.log(session, errorS);
  if (errorS || !session) {
    return NextResponse.json(
      { message: errorS },
      {
        status: 402,
      }
    );
  }
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([
      {
        tarjeta: data.get("tarjeta"),
        act_tf: data.get("act_tf"),
        cell: data.get("cell"),
        email: data.get("email"),
        insta: data.get("insta"),
        Provincia: data.get("Provincia"),
        municipio: data.get("municipio"),
        local: data.get("local"),
        domicilio: data.get("domicilio"),
        reservas: data.get("reservas"),
        moneda_default: data.get("moneda_default"),
        moneda: data.get("moneda"),
        envios: data.get("envios"),
        font: data.get("font"),
      },
    ])
    .eq("sitioweb", params.tienda)
    .select();
  if (error) {
    console.log(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Producto creado" });
}
