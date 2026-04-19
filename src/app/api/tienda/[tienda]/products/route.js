//api/tienda/[tienda]/products/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import {
  createRouteSupabase,
  requireRouteUser,
} from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

export async function GET(request) {
  const supabase = await createRouteSupabase();
  const { data } = await supabase.from("Products").select("*");
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    console.log("POST /products called");
    const data = await request.formData();

    // ── Variantes con sus imágenes ────────────────────────────────────────────
    const variantsRaw = data.get("variants");
    let variants = variantsRaw ? JSON.parse(variantsRaw) : [];
    const variantImageFiles = data.getAll("variantImageFiles"); // File[]
    const variantImageMeta = JSON.parse(data.get("variantImageMeta") || "[]"); // [{variantId, filename}]

    // subir imágenes de variantes
    const variantFileMap = new Map(
      variantImageFiles.map((f) => [f.name ?? "", f]),
    );
    const variantUrlMap = new Map(); // variantId -> url

    await Promise.all(
      variantImageMeta.map(async ({ variantId, filename }) => {
        const file = variantFileMap.get(filename);
        if (!file) return;
        const res = await UploadNewImage(file);
        if (res?.secure_url) variantUrlMap.set(variantId, res.secure_url);
      }),
    );

    variants = variants.map((v) =>
      variantUrlMap.has(v.id) ? { ...v, image: variantUrlMap.get(v.id) } : v,
    );

    // ── Crear producto ────────────────────────────────────────────────────────
    const payload = {
      _title: data.get("title") ?? "",
      _default_moneda: Number(data.get("default_moneda") ?? 0),
      _caja: data.get("caja"),
      _venta: data.get("venta") === "true",
      _descripcion: data.get("descripcion") ?? "",
      _span: data.get("span") === "true",
      _caracteristicas: data.get("caracteristicas"),
      _storeid: data.get("UID"),
      _creado: data.get("creado")
        ? new Date(data.get("creado")).toISOString()
        : null,
      _order: Number(data.get("order") ?? 10000),
      _visible: data.get("visible") === "true",
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

    // ── Insertar variantes ────────────────────────────────────────────────────────
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
      }));

      const { data: insertedVariants, error: varErr } = await supabase
        .from("product_variants")
        .insert(upsertData)
        .select("id, label, attributes"); // <-- necesitamos los IDs reales

      if (varErr) {
        console.error("Error insertando variantes:", varErr);
      } else {
        // ── Insertar quantity_discounts ─────────────────────────────────────
        // Mapear label+attributes del cliente → id real de la BD
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

        if (allDiscounts.length > 0) {
          const { error: qdErr } = await supabase
            .from("quantity_discounts")
            .insert(allDiscounts);
          if (qdErr)
            console.error("Error insertando quantity_discounts:", qdErr);
        }
      }
    }

    const result = {
      ...newProduct,
      variants,
      caracteristicas:
        typeof newProduct.caracteristicas === "string"
          ? JSON.parse(newProduct.caracteristicas)
          : newProduct.caracteristicas,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error en POST /products:", error);
    return NextResponse.json(
      { message: error.message || "Error al crear producto" },
      { status: 500 },
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

    // Borrar imágenes en paralelo (imagen principal + secundarias + variantes)
    await Promise.allSettled(
      values.flatMap((v) => {
        const jobs = [];
        if (v.imageOld) jobs.push(DestroyImage(v.imageOld));
        (v.imagesecondary ?? []).forEach(
          (url) => url && jobs.push(DestroyImage(url)),
        );
        (v.variants ?? []).forEach(
          (vr) => vr.image && jobs.push(DestroyImage(vr.image)),
        );
        return jobs;
      }),
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

        // 1) Actualiza Products solo con columnas que existen ahí
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

        // 2) Actualiza / inserta variantes
        if (Array.isArray(product_variants) && product_variants.length > 0) {
          const variantsPayload = product_variants.map((v) => ({
            id: v.id, // si ya existe, se actualiza
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

async function handleNewSecondaryImages(newImageSecondary, SecondaryImage) {
  if (!Array.isArray(newImageSecondary) || newImageSecondary.length === 0)
    return Array.isArray(SecondaryImage) ? SecondaryImage : [];

  let existing = [];
  if (typeof SecondaryImage === "string") {
    try {
      existing = JSON.parse(SecondaryImage);
    } catch {
      existing = [];
    }
  } else if (Array.isArray(SecondaryImage)) {
    existing = [...SecondaryImage];
  }

  const maxIndex = newImageSecondary.reduce(
    (m, it) => Math.max(m, Number(it?.index) || 0),
    -1,
  );
  const updated = Array.from(
    { length: Math.max(existing.length, maxIndex + 1) },
    (_, i) => existing[i] ?? null,
  );

  for (const item of newImageSecondary) {
    const idx = Number(item?.index);
    const file = item?.file;
    if (!Number.isFinite(idx) || !file) continue;

    const toDelete = updated[idx];
    if (toDelete) await DestroyImage(toDelete).catch(console.warn);

    const res = await UploadNewImage(file);
    updated[idx] = res?.secure_url ?? null;
  }

  return updated;
}
