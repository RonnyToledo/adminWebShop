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
  const tienda = (await params).tienda;
  try {
    const supabase = await createRouteSupabase();

    const { data: tiendas, error } = await supabase
      .from("Sitios")
      .select("*, horarios(*), monedas(*)")
      .eq("sitioweb", tienda);

    if (error) throw error;

    const [a] = tiendas;

    if (!a) {
      return NextResponse.json(
        { message: "Tienda no encontrada" },
        { status: 404 },
      );
    }

    const b = {
      ...a,
      moneda: JSON.parse(a.moneda ?? "null"),
      moneda_default: JSON.parse(a.moneda_default ?? "null"),
      comentario: JSON.parse(a.comentario ?? "null"),
      envios: JSON.parse(a.envios ?? "null"),
    };

    return NextResponse.json(b);
  } catch (error) {
    console.error("[GET /api/tienda/:tienda] Error:", error);
    return NextResponse.json(
      { message: error?.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const uploadedImages = [];

  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return NextResponse.json(
        { message: "La solicitud debe enviarse como multipart/form-data" },
        { status: 415 },
      );
    }

    let data;
    try {
      data = await request.formData();
    } catch (error) {
      console.error("[PUT /api/tienda/:tienda] FormData inválido:", error);
      return NextResponse.json(
        { message: "No se pudo leer el formulario enviado. Inténtalo de nuevo." },
        { status: 400 },
      );
    }
    const sitioweb = (await params).tienda;
    const storeUUID = data.get("UUID");

    // ── Imágenes + Monedas + Horarios: todo en paralelo ──────────────────
    // Ninguno depende del resultado de otro, así que dejamos que corran
    // simultáneamente en vez de esperar uno tras otro.
    let posterResult, bannerResult;

    try {
      const results = await Promise.all([
        processImage(
          data.get("urlPosterNew"),
          data.get("urlPoster"),
          uploadedImages,
        ),
        processImage(data.get("bannerNew"), data.get("banner"), uploadedImages),
        syncMonedasForStore(
          supabase,
          storeUUID,
          JSON.parse(data.get("monedas") ?? "[]"),
        ),
        syncHorariosForStore(
          supabase,
          storeUUID,
          JSON.parse(data.get("horarios") ?? "[]"),
        ),
      ]);

      posterResult = results[0];
      bannerResult = results[1];
      // results[2] = monedas (no necesitamos el valor de retorno)
      // results[3] = horarios (no necesitamos el valor de retorno)
    } catch (parallelError) {
      console.error(
        "[PUT /api/tienda/:tienda] Error en tareas paralelas (imágenes/monedas/horarios):",
        parallelError,
      );
      return NextResponse.json(
        {
          message:
            parallelError?.message || "Error al guardar los datos de la tienda",
        },
        { status: 500 },
      );
    }

    // ── Región ────────────────────────────────────────────────────────────
    const region_code = data.get("region") ?? null;

    // ── Payload principal de Sitios ──────────────────────────────────────
    const payload = {
      name: data.get("name"),
      parrrafo: data.get("parrrafo"),
      urlPoster: posterResult,
      banner: bannerResult,
      stocks: data.get("stocks") === "true",
      local: data.get("local"),
      cell: data.get("cell"),
      email: data.get("email"),
      direccion: data.get("direccion"),
      ...(data.has("ubicacion")
        ? { ubicacion: parseLocation(data.get("ubicacion")) }
        : {}),
      municipio: data.get("municipio"),
      domicilio: data.get("domicilio") === "true",
      view_news: data.get("view_news") === "true",
      category_hidden: data.get("category_hidden") === "true",
      history: data.get("history"),
      envios: data.get("envios"),
      colorAutomatic: data.get("colorAutomatic") === "true",
      region: region_code,
      minimalista: data.get("minimalista") === "true",
      catalogLayout: data.get("catalogLayout"),
      color: data.get("color"),
      redes: JSON.parse(data.get("redes") ?? "[]"),
      contacto: JSON.parse(data.get("contacto") ?? "[]"),
    };

    // FIX: el update ahora ocurre ANTES de validar `error`.
    // Antes, `if (error)` se evaluaba con una variable `error` que aún
    // no existía en este scope (se declaraba más abajo con
    // `const { data: tienda, error } = ...`), así que la validación
    // nunca revisaba el resultado real del update.
    const { data: tienda, error } = await supabase
      .from("Sitios")
      .update([payload])
      .eq("sitioweb", sitioweb)
      .select("*, monedas(*), horarios(*)");

    if (error) {
      console.error(
        "[PUT /api/tienda/:tienda] Error actualizando Sitios:",
        error,
      );
      return NextResponse.json(
        { message: error.message || "Error actualizando la tienda" },
        { status: 500 },
      );
    }

    await Promise.allSettled(
      [
        data.get("urlPosterNew") ? data.get("urlPoster") : null,
        data.get("bannerNew") ? data.get("banner") : null,
      ]
        .filter(Boolean)
        .map((url) => DestroyImage(url)),
    );

    return NextResponse.json({
      message: "Actualizacion exitosa",
      data: tienda,
    });
  } catch (error) {
    await Promise.allSettled(uploadedImages.map((url) => DestroyImage(url)));
    console.error("[PUT /api/tienda/:tienda] Error no manejado:", error);
    return NextResponse.json(
      { message: error?.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ── Helper: procesa una imagen (destroy old + upload new, o mantiene la actual) ──
async function processImage(newFile, oldUrl, uploadedImages) {
  if (!newFile) return oldUrl;
  const uploadResult = await UploadNewImage(newFile);
  if (!uploadResult?.secure_url) throw new Error("No se pudo subir la imagen");
  uploadedImages.push(uploadResult.secure_url);
  return uploadResult.secure_url;
}

function parseLocation(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = JSON.parse(value);
  const latitude = Number(parsed?.latitude);
  const longitude = Number(parsed?.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Las coordenadas de ubicación no son válidas");
  }

  return { latitude, longitude };
}

// ── syncHorariosForStore ────────────────────────────────────────────────────
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

  const { data, error: errIns } = await supabase
    .from("horarios")
    .upsert(rows)
    .select();

  if (errIns) throw errIns;

  return data;
}

// ── syncMonedasForStore ──────────────────────────────────────────────────────
function normalizeMonedaForDb(moneda) {
  if (!moneda || typeof moneda !== "object") return moneda;

  const normalizedValor = Number.parseFloat(
    String(moneda.valor ?? 1).replace(",", "."),
  );

  return {
    ...moneda,
    nombre: String(moneda.nombre ?? "").trim() || "Moneda",
    valor:
      Number.isFinite(normalizedValor) && normalizedValor > 0
        ? Number(normalizedValor.toFixed(6))
        : 1,
    defecto: Boolean(moneda.defecto),
    ui_store: moneda.ui_store ?? undefined,
  };
}

export async function syncMonedasForStore(supabase, ui_store, monedasActuales) {
  if (!ui_store) throw new Error("ui_store es requerido");

  monedasActuales = Array.isArray(monedasActuales)
    ? monedasActuales.map(normalizeMonedaForDb)
    : [];

  const { data: existing, error: errExisting } = await supabase
    .from("monedas")
    .select("*")
    .eq("ui_store", ui_store);

  if (errExisting) throw errExisting;

  const result = diffArrays(existing, monedasActuales, "id");

  if (result.added.length > 0) {
    // FIX: nunca enviar `id` en un insert. `monedas.id` tiene un
    // constraint único GLOBAL (monedas_id_key), y el `id` que trae el
    // objeto "added" puede pertenecer a una fila de otra tienda (por
    // ejemplo si el frontend genera ids locales tipo 1,2,3). Al insertar
    // con ese id explícito, Postgres choca contra la fila existente.
    // Dejamos que la DB autogenere el id (serial/identity).
    const { error: errInsert } = await supabase.from("monedas").insert(
      result.added.map(({ id, ...rest }) =>
        normalizeMonedaForDb({
          ...rest,
          ui_store,
        }),
      ),
    );
    if (errInsert) throw errInsert;
  }

  const toUpsert = (result.updated || []).map((u) =>
    normalizeMonedaForDb({
      ...u.after,
      ui_store,
    }),
  );
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
