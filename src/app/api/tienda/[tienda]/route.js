// api/tienda/${store.sitioweb}/route.js
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
import { uiToDB, DIA_NOMBRES } from "@/types/horario";

export async function GET(request, { params }) {
  const supabase = await createRouteSupabase();

  const { data: tiendas } = await supabase
    .from("Sitios")
    .select("*, horarios(*), monedas(*)")
    .eq("sitioweb", params.tienda);

  const [a] = tiendas;

  // horarios viene como array de rows; el cliente los normaliza con buildHorarioCompleto
  // si necesitas devolverlos ya convertidos, importa buildHorarioCompleto aquí también
  const b = {
    ...a,
    moneda: JSON.parse(a.moneda ?? "null"),
    moneda_default: JSON.parse(a.moneda_default ?? "null"),
    comentario: JSON.parse(a.comentario ?? "null"),
    envios: JSON.parse(a.envios ?? "null"),
    // horario ya NO viene como text; viene como a.horarios (array de rows)
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
  const sitioweb = (await params).tienda;
  const storeUUID = data.get("UUID");

  // ── Imágenes ────────────────────────────────────────────────────────────────
  let NewPoster, NewBanner;

  const urlPosterNew = data.get("urlPosterNew");
  if (urlPosterNew) {
    const imageOld = data.get("urlPoster");
    if (imageOld) await DestroyImage(imageOld);
    const res = await UploadNewImage(urlPosterNew);
    NewPoster = res.secure_url;
  } else {
    NewPoster = data.get("urlPoster");
  }

  const bannerNew = data.get("bannerNew");
  if (bannerNew) {
    const imageOld = data.get("banner");
    if (imageOld) await DestroyImage(imageOld);
    const res = await UploadNewImage(bannerNew);
    NewBanner = res.secure_url;
  } else {
    NewBanner = data.get("banner");
  }
  // ── Monedas ─────────────────────────────────────────────────────────────────
  await syncMonedasForStore(
    supabase,
    storeUUID,
    JSON.parse(data.get("monedas") ?? "[]"),
  );

  // ── Horarios ─────────────────────────────────────────────────────────────────
  // El cliente envía el array UI de 7 días; lo convertimos a rows de la tabla
  const horarioUI = JSON.parse(data.get("horarios") ?? "[]");
  await syncHorariosForStore(supabase, storeUUID, horarioUI);

  // ── Payload principal de Sitios ──────────────────────────────────────────────
  const payload = {
    name: data.get("name"),
    parrrafo: data.get("parrrafo"),
    urlPoster: NewPoster,
    banner: NewBanner,
    act_tf: data.get("act_tf") === "true",
    stocks: data.get("stocks") === "true",
    local: data.get("local"),
    cell: data.get("cell"),
    email: data.get("email"),
    insta: data.get("insta"),
    country: data.get("country"),
    Provincia: data.get("Provincia"),
    municipio: data.get("municipio"),
    domicilio: data.get("domicilio") === "true",
    history: data.get("history"),
    envios: data.get("envios"),
    grid: data.get("grid"),
    horizontal: data.get("horizontal"),
    square: data.get("square"),
    minimalista: data.get("minimalista"),
    color: data.get("color"),
    redes: JSON.parse(data.get("redes") ?? "[]"),
    contacto: JSON.parse(data.get("contacto") ?? "[]"),
    // horario (text) ya no se actualiza aquí — ahora vive en tabla horarios
  };

  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([payload])
    .eq("sitioweb", sitioweb)
    .select("*, monedas(*), horarios(*)");

  if (error) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || error },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Actualizacion exitosa", data: tienda });
}

// ── syncHorariosForStore ──────────────────────────────────────────────────────
/**
 * Recibe el array UI de 7 días y hace upsert completo en la tabla horarios.
 * Usa ON CONFLICT (sitio_id, dia) para actualizar filas existentes.
 */
export async function syncHorariosForStore(supabase, sitio_id, horarioRows) {
  if (!sitio_id) throw new Error("sitio_id es requerido");
  if (!Array.isArray(horarioRows) || horarioRows.length === 0) return;

  const diasEnviados = [...new Set(horarioRows.map((r) => Number(r.dia)))];

  const { error: errDel } = await supabase
    .from("horarios")
    .delete()
    .eq("sitio_id", sitio_id)
    .in("dia", diasEnviados);

  if (errDel) throw errDel;

  const rows = horarioRows.map((r) => ({
    sitio_id,
    dia: Number(r.dia),
    turno: Number(r.turno ?? 0),
    open: Boolean(r.open),
    apertura: r.apertura,
    cierre: r.cierre,
  }));

  // ← Cambiar insert por upsert con select para obtener los IDs nuevos
  const { data, error: errIns } = await supabase
    .from("horarios")
    .upsert(rows)
    .select(); // ← esto devuelve las filas con sus nuevos IDs

  if (errIns) throw errIns;

  return data; // ← retornar los rows frescos con IDs correctos
}
// ── syncMonedasForStore (sin cambios) ────────────────────────────────────────
export async function syncMonedasForStore(supabase, ui_store, monedasActuales) {
  if (!ui_store) throw new Error("ui_store es requerido");

  monedasActuales = Array.isArray(monedasActuales) ? monedasActuales : [];

  const { data: existing, error: errExisting } = await supabase
    .from("monedas")
    .select("*")
    .eq("ui_store", ui_store);

  if (errExisting) throw errExisting;

  const result = diffArrays(existing, monedasActuales, "id");

  if (result.added.length > 0) {
    const { error: errInsert } = await supabase.from("monedas").insert(
      result.added.map((obj) => ({
        nombre: obj.nombre,
        valor: obj.valor,
        defecto: obj.defecto,
        ui_store: obj.ui_store,
      })),
    );
    if (errInsert) throw errInsert;
  }

  const toUpsert = (result.updated || []).map((u) => ({
    ...u.after,
    ui_store,
  }));
  if (toUpsert.length > 0) {
    const { error: errUpsert } = await supabase
      .from("monedas")
      .upsert(toUpsert);
    if (errUpsert) throw errUpsert;
  }

  if (result.removed.length > 0) {
    const idsToDelete = result.removed
      .map((obj) => Number(obj.id))
      .filter((id) => Number.isFinite(id));

    if (idsToDelete.length > 0) {
      const { error: errDel } = await supabase
        .from("monedas")
        .delete()
        .eq("ui_store", ui_store)
        .in("id", idsToDelete);
      if (errDel) throw errDel;
    }
  }
}
