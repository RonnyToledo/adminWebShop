import { NextResponse } from "next/server";
import {
  createRouteSupabase,
  requireRouteUser,
} from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";
import { diffArrays } from "@/components/globalFunction/diferenciasDeArray";

export async function GET(request, { params }) {
  const supabase = await createRouteSupabase();
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
  let supabase;
  try {
    ({ supabase } = await requireRouteUser());
  } catch {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

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

  await syncMonedasForStore(
    supabase,
    data.get("UUID"),
    JSON.parse(data.get("monedas")),
  );

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
    grid: data.get("grid"),
    horizontal: data.get("horizontal"),
    square: data.get("square"),
    minimalista: data.get("minimalista"),
    color: data.get("color"),
    redes: JSON.parse(data.get("redes") || "[]"),
    contacto: JSON.parse(data.get("contacto") || "[]"),
  };
  //Preparando nueva Imagen
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([payload])
    .eq("sitioweb", sitioweb)
    .select("* ,monedas(*)");

  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: error.message || error },
      {
        status: 500,
      },
    );
  }
  return NextResponse.json({ message: "Actualizacion exitosa", data: tienda });
}
export async function syncMonedasForStore(supabase, ui_store, monedasActuales) {
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
        })),
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
