import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";
import { cookies } from "next/headers"; // Importar cookies desde headers
import { diffArrays } from "@/components/globalFunction/diferenciasDeArray";

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

  await syncMonedasForStore(data.get("UUID"), JSON.parse(data.get("monedas")));

  const payload = {
    name: data.get("name"),
    parrrafo: data.get("parrrafo"),
    horario: data.get("horario"),
    urlPoster: NewPoster,
    banner: NewBanner,
    act_tf: data.get("act_tf") == "true",
    stocks: data.get("stocks") == "true",
    local: data.get("local"),
    cell: data.get("cell"),
    email: data.get("email"),
    insta: data.get("insta"),
    country: data.get("country"),
    Provincia: data.get("Provincia"),
    municipio: data.get("municipio"),
    domicilio: data.get("domicilio") == "true",
    history: data.get("history"),
    envios: data.get("envios"),
    edit: data.get("edit"),
    redes: JSON.parse(data.get("redes") || "[]"),
    contacto: JSON.parse(data.get("contacto") || "[]"),
  };
  //Preparando nueva Imagen
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([payload])
    .eq("sitioweb", sitioweb)
    .select("* ,monedas(*)")
    .single();

  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Actualizacion exitosa", data: tienda });
}
// supabase: instancia ya creada
// ui_store: UUID del sitio (string)
// monedasActuales: array que tienes en el cliente,
//   p.ej. [{ id: 1, nombre: 'USD', valor: 100, defecto: true }, { nombre: 'EUR', valor: 90 }]

export async function syncMonedasForStore(ui_store, monedasActuales) {
  if (!ui_store) throw new Error("ui_store es requerido");

  // Normalizar entradas (evitar undefined)
  monedasActuales = Array.isArray(monedasActuales) ? monedasActuales : [];

  // 1) Traer ids existentes para ESTE ui_store
  const { data: existing, error: errExisting } = await supabase
    .from("monedas")
    .select("*")
    .eq("ui_store", ui_store);

  if (errExisting) throw errExisting;
  const result = diffArrays(existing, monedasActuales, "id");

  let insertedRows = [];

  if (result.added.length > 0) {
    const { data: inserted, error: errInsert } = await supabase
      .from("monedas")
      .insert(
        result.added.map((obj) => ({
          nombre: obj.nombre,
          valor: obj.valor,
          defecto: obj.defecto,
          ui_store: obj.ui_store,
        }))
      )
      .select(); // pedir representation para obtener ids nuevos

    if (errInsert) throw errInsert;
    insertedRows = inserted || [];
  }

  // 4) Upsert/actualizar los existentes (si hay)
  const toUpsert = (result.updated || []).map((u) => ({
    ...u.after,
    ui_store,
  }));
  let upsertedRows = [];
  if (toUpsert.length > 0) {
    // Utilizamos upsert con onConflict sobre 'id' para actualizar en bloque.
    // Si tu PK es compuesto o tienes otro constraint, ajusta onConflict accordingly.
    const { data: upserted, error: errUpsert } = await supabase
      .from("monedas")
      .upsert(toUpsert)
      .select();

    if (errUpsert) throw errUpsert;
    upsertedRows = upserted || [];
  }

  if (result.removed.length > 0) {
    const idsToDelete = result.removed
      .map((obj) => Number(obj.id))
      .filter((id) => Number.isFinite(id)); // quitar null/undefined/NaN

    if (idsToDelete.length > 0) {
      const { error: errDel } = await supabase
        .from("monedas")
        .delete()
        .eq("ui_store", ui_store)
        .in("id", idsToDelete); // PASAR UN ARRAY, no una cadena

      if (errDel) throw errDel;
    }
  }
}
