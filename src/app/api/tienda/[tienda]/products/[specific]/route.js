// src\app\api\tienda\[tienda]\products\[specific]\route.js
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
import { GeminiAsk } from "@/hooks/gemini";

const FORCE_PRICE_MODES = new Set(["default", "fixed", "disabled"]);

const parseJSONOr = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

function sanitizeForcePrice(raw) {
  if (!raw || typeof raw !== "object") return {};
  const clean = {};
  for (const [monedaId, cfg] of Object.entries(raw)) {
    if (!cfg || typeof cfg !== "object") continue;
    const mode = cfg.mode;
    if (!FORCE_PRICE_MODES.has(mode) || mode === "default") continue;
    if (mode === "disabled") {
      clean[monedaId] = { mode: "disabled" };
      continue;
    }
    // mode === "fixed"
    const value = Number(cfg.value);
    if (!Number.isFinite(value) || value <= 0) continue;
    clean[monedaId] = { mode: "fixed", value };
  }
  return clean;
}

export async function GET() {
  const supabase = await createRouteSupabase();
  const { data } = await supabase.from("Products").select("*");
  return NextResponse.json(data);
}

export async function PUT(request) {
  const uploadedImages = [];
console.log("PUT /products/[productId] called");
  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const data = await request.formData();
    const productId = data.get("Id");

    if (!productId) {
      return NextResponse.json(
        { message: "Falta el Id del producto" },
        { status: 400 },
      );
    }

    const rawPublishAt = data.get("publish_at");
    let publishAt = null;
    if (typeof rawPublishAt === "string" && rawPublishAt.trim()) {
      const parsedPublishAt = new Date(rawPublishAt);
      if (Number.isNaN(parsedPublishAt.getTime())) {
        return NextResponse.json(
          { message: "La fecha de publicación no es válida" },
          { status: 400 },
        );
      }
      publishAt = parsedPublishAt.toISOString();
    } else if (rawPublishAt !== null && typeof rawPublishAt !== "string") {
      return NextResponse.json(
        { message: "La fecha de publicación no es válida" },
        { status: 400 },
      );
    }

    // ── Variantes ─────────────────────────────────────────────────────────────
    // Todas las imágenes viven acá. Aunque el producto tenga una sola
    // variante, esa variante es la "default"/principal (default_variant: true
    // o attributes.es_default: true) y es la que carga la imagen que se
    // muestra como foto del producto. Products NO tiene columna image.
    let variants = JSON.parse(data.get("variants") ?? "[]");
    const variantImageFiles = data.getAll("variantImageFiles");
    const variantImageMeta = JSON.parse(data.get("variantImageMeta") ?? "[]");
    const variantImageDelete = JSON.parse(
      data.get("variantImageDelete") ?? "[]",
    );

    // Borrar imágenes de variantes marcadas para eliminar
    await Promise.allSettled(
      variantImageDelete.map((url) => DestroyImage(url)),
    );

    // Subir imágenes nuevas de variantes
    const variantFileMap = new Map(variantImageFiles.map((f) => [f.name, f]));
    const variantUrlMap = new Map();
    await Promise.all(
      variantImageMeta.map(async ({ variantId, filename }) => {
        const file = variantFileMap.get(filename);
        if (!file) return;
        const res = await UploadNewImage(file);
        if (res?.secure_url) {
          variantUrlMap.set(variantId, res.secure_url);
          uploadedImages.push(res.secure_url);
        }
      }),
    );
    variants = variants.map((v) =>
      variantUrlMap.has(v.id) ? { ...v, image: variantUrlMap.get(v.id) } : v,
    );

    // ── Combos ────────────────────────────────────────────────────────────────
    const combosRaw = data.get("combos");
    if (combosRaw) {
      const incomingCombos = JSON.parse(combosRaw);
      await supabase
        .from("product_combos")
        .delete()
        .eq("product_id", productId);
      const comboRows = incomingCombos
        .filter((rid) => rid && rid !== productId)
        .map((rid) => ({ product_id: productId, related_id: rid }));
      if (comboRows.length > 0) {
        await supabase.from("product_combos").insert(comboRows);
      }
    }

    let descripcion = data.get("descripcion") ?? "";

    if (data.get("modified_extract") === "true") {
      try {
        const infoSections = JSON.parse(data.get("info_sections") ?? "[]");

        if (infoSections.length > 0) {
          const result = await GeminiAsk(
            `Creame de este json con las diferentes informaciones del producto ${data.get("title") ?? ""}, un resumen de descripción de producto para que sea más atractivo, claro , profesional y corto, manteniendo la intención original. Hazlo más legible, corrige errores y alarga ligeramente si ayuda a la claridad:\n\n${JSON.stringify(infoSections)}\n\nEntrega solo el texto, sin explicaciones ni formato adicional, de no mas de 20 palabras.`,
          );

          if (result && typeof result === "string") {
            descripcion = result;
          }
        } else {
          descripcion = "";
        }
      } catch (err) {
        console.error("⚠️ Gemini falló, usando descripción base:", err);
        // NO haces throw → continúa flujo normal
      }
    }

    // ── Update producto ───────────────────────────────────────────────────────
    // Sin "image" ni "imagesecondary": Products no tiene esas columnas.
    const { error: productError } = await supabase
      .from("Products")
      .update({
        title: data.get("title") ?? "",
        descripcion: descripcion,
        favorito: data.get("favorito") === "true",
        order: Number(data.get("order") ?? 0),
        caja: data.get("caja") ?? null,
        visible: data.get("visible") === "true",
        span: data.get("span") === "true",
        venta: data.get("venta") === "true",
        default_moneda: Number(data.get("default_moneda") ?? 0),
        caracteristicas: parseJSONOr(data.get("caracteristicas"), []),
        info_sections: parseJSONOr(data.get("info_sections"), []),
        publish_at: publishAt,
      })
      .eq("productId", productId);

    if (productError) {
      console.error("Error actualizando producto:", productError);
      throw productError;
    }

    // ── Eliminar variantes que ya no existen y hacer upsert ────────────────
    const { data: existingVariants } = await supabase
      .from("product_variants")
      .select("id, image")
      .eq("product_id", productId);

    const existingIds = (existingVariants ?? []).map((v) => v.id);
    const incomingIds = variants.map((v) => v.id).filter(Boolean);
    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));

    if (idsToDelete.length > 0) {
      const imagesToDelete = (existingVariants ?? [])
        .filter((v) => idsToDelete.includes(v.id))
        .map((v) => v.image)
        .filter(Boolean);

      await Promise.allSettled(imagesToDelete.map((url) => DestroyImage(url)));

      const { error: deleteQdError } = await supabase
        .from("quantity_discounts")
        .delete()
        .in("variant_id", idsToDelete);

      if (deleteQdError) {
        console.error(
          "Error eliminando descuentos por cantidad:",
          deleteQdError,
        );
      }

      const { error: deleteError } = await supabase
        .from("product_variants")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error("Error eliminando variantes:", deleteError);
      }
    }

    // Upsert de variantes actuales
    if (variants.length > 0) {
      const variantsPayload = variants.map((v) => ({
        id: v.id,
        product_id: productId,
        label: v.label ?? null,
        price: Number(v.price) || 0,
        old_price: Number(v.old_price) || 0,
        stock: Number(v.stock) || 0,
        image: v.image ?? null,
        default_variant: !!v.default_variant,
        attributes: v.attributes ?? {},
        force_price: sanitizeForcePrice(v.force_price),
        updated_at: new Date().toISOString(),
      }));
      const { error: variantError } = await supabase
        .from("product_variants")
        .upsert(variantsPayload, { onConflict: "id" });

      if (variantError) {
        console.error("Error en variantes:", variantError);
        throw variantError;
      }
    }

    // ── Devolver producto actualizado ─────────────────────────────────────────
    const { data: updated, error: fetchError } = await supabase
      .from("Products")
      .select("*, product_variants(*)")
      .eq("productId", productId)
      .single();
    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(
      {
        data: {
          ...updated,
          caracteristicas: JSON.parse(updated.caracteristicas),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    await Promise.allSettled(uploadedImages.map((url) => DestroyImage(url)));
    console.error("PUT /products/[productId] error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
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
    const { error: errInsert } = await supabase.from("monedas").insert(
      result.added.map((obj) =>
        normalizeMonedaForDb({
          ...obj,
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
