//src\app\api\tienda\[tienda]\products\route.js
import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";
import { GeminiAsk } from "@/hooks/gemini";

const FORCE_PRICE_MODES = new Set(["default", "fixed", "disabled"]);

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
const parseJSONOr = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

function parseFormJSON(formData, field, fallback) {
  const raw = formData.get(field);
  if (raw == null || raw === "") return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(`El campo ${field} no contiene JSON válido`);
    error.status = 400;
    throw error;
  }
}

function parseNullableIsoDate(raw, fieldName) {
  if (raw == null || raw === "") return null;

  const text = String(raw).trim();
  if (!text) return null;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    console.warn(`Fecha inválida para ${fieldName}:`, text);
    return null;
  }

  return parsed.toISOString();
}

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function GET() {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { data: tienda, error } = await supabase.from("Sitios").select("*");
    if (error)
      return NextResponse.json({ message: error.message }, { status: 500 });

    const a = (tienda || []).map((obj) => {
      return {
        ...obj,
        categoria: parseJSONOr(obj.categoria, null),
        comentario: parseJSONOr(obj.comentario, null),
        envios: parseJSONOr(obj.envios, null),
      };
    });

    const response = NextResponse.json(a);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const uploadedImages = [];

  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const data = await request.formData();

    // ── Variantes con sus imágenes ────────────────────────────────────────────
    // Todas las imágenes del producto viven acá, incluida la principal (la
    // variante default). Products no tiene ni tendrá columna image.
    let variants = parseFormJSON(data, "variants", []);
    const variantImageFiles = data.getAll("variantImageFiles");
    const variantImageMeta = parseFormJSON(data, "variantImageMeta", []);

    const variantFileMap = new Map(
      variantImageFiles.map((f) => [f.name ?? "", f]),
    );
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

    const combosRaw = data.get("combos");

    let descripcion = data.get("descripcion") ?? "";

    try {
      const infoSections = parseFormJSON(data, "info_sections", []);

      if (infoSections.length > 0) {
        const result = await GeminiAsk(
          `Creame de este json con las diferentes informaciones del producto ${data.get("title") ?? ""}, un resumen de descripción de producto para que sea más atractivo, claro , profesional y corto, manteniendo la intención original. Hazlo más legible, corrige errores y alarga ligeramente si ayuda a la claridad:\n\n${JSON.stringify(infoSections)}\n\nEntrega solo el texto, sin explicaciones ni formato adicional, de no mas de 20 palabras.`,
        );
        console.info("GeminiAsk result:", result);
        if (result && typeof result === "string") {
          descripcion = result;
        }
      } else {
        descripcion = "";
      }
    } catch (err) {
      console.error("⚠️ Gemini falló, usando descripción base:", err);
    }

    // ── Crear producto ────────────────────────────────────────────────────────
    const payload = {
      _title: data.get("title") ?? "",
      _default_moneda: Number(data.get("default_moneda") ?? 0),
      _caja: data.get("caja"),
      _venta: data.get("venta") === "true",
      _descripcion: descripcion,
      _span: data.get("span") === "true",
      _caracteristicas: parseJSONOr(data.get("caracteristicas"), []),
      _storeid: data.get("UID"),
      _creado: parseNullableIsoDate(data.get("creado"), "creado"),
      _order: Number(data.get("order") ?? 10000),
      _visible: data.get("visible") === "true",
      _info_sections: parseFormJSON(data, "info_sections", []),
      _publish_at: parseNullableIsoDate(data.get("publish_at"), "publish_at"),
    };

    const { data: newProduct, error } = await supabase
      .rpc("create_product", payload)
      .single();

    if (error) {
      console.error("RPC create_product error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    if (newProduct?.error) {
      return NextResponse.json(
        { message: newProduct.error, code: newProduct.code },
        { status: 400 },
      );
    }

    // ── Insertar variantes ────────────────────────────────────────────────────
    let insertedVariantsWithDiscounts = null;

    if (variants.length > 0) {
      const productId = newProduct.productId;
      const upsertData = variants.map((v) => ({
        product_id: productId,
        label: v.label ?? "",
        attributes: v.attributes ?? {},
        price: Number(v.price) || 0,
        old_price: Number(v.old_price) || 0,
        stock: Number(v.stock) || 0,
        image: v.image ?? null,
        default_variant: !!v.default_variant,
        force_price: sanitizeForcePrice(v.force_price),
      }));

      const { data: insertedVariants, error: varErr } = await supabase
        .from("product_variants")
        .insert(upsertData)
        .select(
          "id, label, attributes, price, old_price, stock, image, default_variant, force_price",
        );

      if (varErr) {
        console.error("Error insertando variantes:", varErr);
      } else {
        const labelToId = new Map(
          (insertedVariants ?? []).map((iv) => [iv.label, iv.id]),
        );

        const allDiscounts = variants.flatMap((v) => {
          const realId = labelToId.get(v.label) ?? v.id;
          return (v.quantity_discounts ?? []).map((qd) => ({
            variant_id: realId,
            product_id: productId,
            min_qty: Number(qd.min_qty) || 1,
            max_qty: qd.max_qty != null ? Number(qd.max_qty) : null,
            type: qd.type ?? "quantity",
            value: Number(qd.value) || 0,
          }));
        });

        let insertedDiscounts = [];
        if (allDiscounts.length > 0) {
          const { data: qdData, error: qdErr } = await supabase
            .from("quantity_discounts")
            .insert(allDiscounts)
            .select("*");
          if (qdErr)
            console.error("Error insertando quantity_discounts:", qdErr);
          else insertedDiscounts = qdData ?? [];
        }

        insertedVariantsWithDiscounts = (insertedVariants ?? []).map((iv) => ({
          ...iv,
          quantity_discounts: insertedDiscounts.filter(
            (qd) => qd.variant_id === iv.id,
          ),
        }));
      }
    }

    // ── Insertar combos ──────────────────────────────────────────────────────
    if (combosRaw) {
      const incomingCombos = parseFormJSON(data, "combos", []);

      const comboRows = incomingCombos
        .filter((rid) => rid && rid !== newProduct.productId)
        .map((rid) => ({
          product_id: newProduct.productId,
          related_id: rid,
        }));

      if (comboRows.length > 0) {
        const { error: comboErr } = await supabase
          .from("product_combos")
          .insert(comboRows);
        if (comboErr) console.error("Error insertando combos:", comboErr);
      }
    }

    // ── Respuesta final con IDs reales de BD ──────────────────────────────────
    // La "imagen del producto" para cualquier consumidor (toast, listados,
    // combos) sale de la variante default dentro de product_variants — no
    // hay columna image en Products ni sincronización que hacer acá.
    const finalVariants = insertedVariantsWithDiscounts ?? variants;

    const result = {
      ...newProduct,
      variants: finalVariants,
      product_variants: finalVariants,
      combos: parseFormJSON(data, "combos", []),
      caracteristicas: parseJSONOr(newProduct?.caracteristicas, []),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    await Promise.allSettled(uploadedImages.map((url) => DestroyImage(url)));
    console.error("Error en POST /products:", error);
    return NextResponse.json(
      { message: error.message || "Error al crear producto" },
      { status: error.status ?? 500 },
    );
  }
}

export async function PUT(request) {
  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }
    const data = await request.formData();
    const products = JSON.parse(data.get("products"));
    await updateProductsInBatches(supabase, products, 10);
    return NextResponse.json({
      message: "Productos y variantes actualizados correctamente.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const data = await request.formData();
    const valuesRaw = data.get("values");
    if (!valuesRaw)
      return NextResponse.json({ message: "No values" }, { status: 400 });

    const values = JSON.parse(valuesRaw);
    if (!Array.isArray(values) || values.length === 0)
      return NextResponse.json({ message: "Array vacío" }, { status: 400 });

    // Las imágenes a limpiar en Cloudinary solo pueden venir de las
    // variantes (Products ya no guarda image/imagesecondary).
    await Promise.allSettled(
      values.flatMap((v) =>
        (v.product_variants ?? v.variants ?? [])
          .map((vr) => vr.image)
          .filter(Boolean)
          .map((url) => DestroyImage(url)),
      ),
    );

    const ids = values.map((v) => v.productId).filter(Boolean);
    await supabase.from("product_variants").delete().in("product_id", ids);
    const { error } = await supabase
      .from("Products")
      .delete()
      .in("productId", ids);
    if (error)
      return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ message: "Eliminados correctamente" });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

async function updateProductsInBatches(supabase, products, batchSize = 10) {
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item) => {
        const {
          productId,
          order,
          caja,
          visible,
          title,
          descripcion,
          favorito,
          span,
          venta,
          default_moneda,
          product_variants = [],
        } = item;

        const { error: productError } = await supabase
          .from("Products")
          .update({
            title,
            descripcion,
            favorito,
            order,
            caja,
            visible,
            span,
            venta,
            default_moneda,
          })
          .eq("productId", productId);

        if (productError) {
          throw productError;
        }

        if (Array.isArray(product_variants) && product_variants.length > 0) {
          const variantsPayload = product_variants.map((v) => ({
            id: v.id,
            product_id: productId,
            label: v.label ?? null,
            price: v.price ?? null,
            old_price: v.old_price ?? null,
            stock: v.stock ?? 0,
            image: v.image ?? null,
            default_variant: !!v.default_variant,
            attributes: v.attributes ?? {},
            updated_at: new Date().toISOString(),
          }));

          const { error: variantError } = await supabase
            .from("product_variants")
            .upsert(variantsPayload, { onConflict: "id" });

          if (variantError) {
            throw variantError;
          }
        }
      }),
    );
  }
}
