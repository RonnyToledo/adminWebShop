import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";
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
  if (parsedCookie.access_token && parsedCookie.refresh_token)
    console.info("Token recividos");
  else console.error("Token no encontrado");
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function GET(request, { params }) {
  const supabase = createClient();
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

export async function PUT(request, { params }) {
  await LogUser();
  const data = await request.formData();
  const urlPosterNew = data.get("urlPosterNew");
  const bannerNew = data.get("bannerNew");
  const sitioweb = (await params).tienda;

  let NewBanner;
  let NewPoster;
  if (urlPosterNew) {
    // Con imagen nueva
    // Eliminando Imagen antigua
    const imageOld = data.get("urlPoster");
    if (imageOld) {
      await DestroyImage(imageOld);
    }
    const resUrlPosterNew = await UploadNewImage(urlPosterNew);
    NewPoster = resUrlPosterNew.secure_url;
  } else {
    NewPoster = data.get("urlPoster");
  }
  if (bannerNew) {
    // Con imagen nueva
    // Eliminando Imagen antigua
    const imageOld = data.get("banner");
    if (imageOld) {
      await DestroyImage(imageOld);
    }
    const resBannerNew = await UploadNewImage(bannerNew);
    NewBanner = resBannerNew.secure_url;
  } else {
    NewBanner = data.get("banner");
  }

  //Preparando nueva Imagen
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([
      {
        name: data.get("name"),
        parrrafo: data.get("parrrafo"),
        horario: data.get("horario"),
        urlPoster: NewPoster,
        banner: NewBanner,
        act_tf: data.get("act_tf"),
        cell: data.get("cell"),
        email: data.get("email"),
        insta: data.get("insta"),
        country: data.get("country"),
        Provincia: data.get("Provincia"),
        municipio: data.get("municipio"),
        domicilio: data.get("domicilio"),
        moneda_default: data.get("moneda_default"),
        moneda: data.get("moneda"),
        envios: data.get("envios"),
        edit: data.get("edit"),
      },
    ])
    .eq("sitioweb", sitioweb)
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

  return NextResponse.json({ message: "Producto creado" });
}
