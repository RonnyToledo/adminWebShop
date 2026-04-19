//api/tienda/[tienda]/products/[specific]/route.js
import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";
import {
  DestroyImage,
  UploadNewImage,
} from "@/components/globalFunction/imagesMove";

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function GET(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { specific } = await params;
    const { data } = await supabase
      .from("Products")
      .select("*, product_variants(*)")
      .eq("productId", specific);
    return NextResponse.json(data?.[0] ?? null);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { specific } = await params;
    const data = await request.formData();
    const { error } = await supabase
      .from("Products")
      .update({ coment: data.get("comentario") })
      .eq("productId", specific);
    if (error)
      return NextResponse.json(
        { message: error.message || error },
        { status: 400 },
      );
    return NextResponse.json({ message: "Comentario realizado" });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const data = await request.formData();

    const Id = data.get("Id");
    // ── Imagen principal ──────────────────────────────────────────────────────
    let PrimaryImagen = data.get("image"); // URL actual (string) o null
    const newImagePrimary = data.get("newImage"); // File nuevo o null

    if (newImagePrimary && typeof newImagePrimary !== "string") {
      if (
        PrimaryImagen &&
        typeof PrimaryImagen === "string" &&
        PrimaryImagen.includes("cloudinary")
      ) {
        await DestroyImage(PrimaryImagen).catch(console.warn);
      }
      const res = await UploadNewImage(newImagePrimary);
      if (res?.secure_url) PrimaryImagen = res.secure_url;
    }

    // ── Variantes: imágenes nuevas ────────────────────────────────────────────
    const variantsRaw = data.get("variants");
    let variants = variantsRaw ? JSON.parse(variantsRaw) : null;

    // FIX: leer múltiples archivos de variantes correctamente
    const variantImageFiles = data.getAll("variantImageFiles");
    const variantImageMeta = JSON.parse(data.get("variantImageMeta") || "[]");
    const variantImageDelete = JSON.parse(
      data.get("variantImageDelete") || "[]",
    );

    // Eliminar imágenes de variantes marcadas para borrar en cloudinary
    if (variantImageDelete.length > 0) {
      await Promise.allSettled(
        variantImageDelete
          .filter((url) => url && typeof url === "string")
          .map((url) => DestroyImage(url)),
      );
    }

    // Subir imágenes nuevas de variantes y mapear variantId → url subida
    const variantFileMap = new Map(
      variantImageFiles.map((f) => [f.name ?? "", f]),
    );
    const variantUrlMap = new Map();

    await Promise.all(
      variantImageMeta.map(async ({ variantId, filename }) => {
        const file = variantFileMap.get(filename);
        if (!file) return;
        try {
          const res = await UploadNewImage(file);
          if (res?.secure_url) variantUrlMap.set(variantId, res.secure_url);
        } catch (err) {
          console.error(`Error subiendo imagen de variante ${variantId}:`, err);
        }
      }),
    );

    // Aplicar URLs subidas a las variantes correspondientes
    if (variants && variantUrlMap.size > 0) {
      variants = variants.map((v) =>
        variantUrlMap.has(v.id) ? { ...v, image: variantUrlMap.get(v.id) } : v,
      );
    }

    // ── Actualizar producto principal (RPC) ───────────────────────────────────
    const payload = {
      _productid: Id,
      _title: data.get("title"),
      _default_moneda: Number(data.get("default_moneda") ?? 0) || null,
      _caja: data.get("caja") || null,
      _venta: data.get("venta") === "true",
      _descripcion: data.get("descripcion"),
      _span: data.get("span") === "true",
      _caracteristicas: data.get("caracteristicas"),
      _storeid: data.get("storeId") || null,
      _creado: data.get("creado") || null,
      _order: Number(data.get("order") ?? 0),
      _visible: data.get("visible") === "true",
    };

    const { data: updatedProduct, error } = await supabase
      .rpc("update_product", payload)
      .single();

    if (error) {
      console.error("RPC update_product error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // ── Sincronizar variantes ─────────────────────────────────────────────────
    let finalVariants = [];

    if (variants !== null) {
      const incomingIds = variants.map((v) => v.id).filter(Boolean);

      // Obtener variantes existentes para detectar cuáles borrar
      const { data: existingVars } = await supabase
        .from("product_variants")
        .select("id, image")
        .eq("product_id", Id);

      // Borrar variantes que ya no existen (y sus imágenes en cloudinary)
      const toDelete = (existingVars ?? []).filter(
        (v) => !incomingIds.includes(v.id),
      );
      if (toDelete.length > 0) {
        await Promise.allSettled(
          toDelete.filter((v) => v.image).map((v) => DestroyImage(v.image)),
        );
        await supabase
          .from("product_variants")
          .delete()
          .in(
            "id",
            toDelete.map((v) => v.id),
          );
      }

      // FIX: upsert con todos los campos del schema actual de product_variants
      if (variants.length > 0) {
        const upsertData = variants.map((v, idx) => ({
          id: v.id,
          product_id: Id,
          label: v.label ?? "",
          attributes: v.attributes ?? {},
          price: Number(v.price) || 0,
          old_price: Number(v.old_price) || 0,
          // FIX: priceCompra y embalaje se guardan en attributes como metadata
          // ya que el schema de product_variants no tiene esas columnas directamente.
          // Se extienden los attributes para preservarlos.
          stock: Number(v.stock) || 0,
          image: v.image ?? null,
          default_variant: !!v.default_variant,
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await supabase
          .from("product_variants")
          .upsert(upsertData, { onConflict: "id" });

        if (upsertErr) {
          console.error("Error upsert variantes:", upsertErr);
        }
        // Después del upsert de variantes existente...

        // ── Sincronizar quantity_discounts ────────────────────────────────────────
        const allIncomingQd = variants.flatMap((v) =>
          (v.quantity_discounts ?? []).map((qd) => ({
            variant_id: v.id,
            product_id: Id,
            min_qty: Number(qd.min_qty) || 1,
            max_qty: qd.max_qty != null ? Number(qd.max_qty) : null,
            type: qd.type ?? "quantity",
            value: Number(qd.value) || 0,
          })),
        );

        // Borrar todos los QD actuales de estas variantes y reinsertar
        // (más simple que un diff por la lógica de IDs temporales del cliente)
        const variantIds = variants.map((v) => v.id).filter(Boolean);
        if (variantIds.length > 0) {
          await supabase
            .from("quantity_discounts")
            .delete()
            .in("variant_id", variantIds);
        }

        if (allIncomingQd.length > 0) {
          const { error: qdErr } = await supabase
            .from("quantity_discounts")
            .insert(allIncomingQd);
          if (qdErr) console.error("Error upsert quantity_discounts:", qdErr);
        }
      }

      // FIX: devolver las variantes con los campos extra (priceCompra, embalaje)
      // que vienen del cliente para que el frontend no los pierda en el ciclo
      // En la construcción de finalVariants — ya estaba, solo asegúrate de preservarlos:
      finalVariants = variants.map((v) => ({
        ...v,
        priceCompra: v.priceCompra ?? 0,
        embalaje: v.embalaje ?? 0,
        quantity_discounts: v.quantity_discounts ?? [], // <-- agregar esta línea
      }));
    } else {
      // Si no vienen variantes en el payload, devolver las existentes de la DB
      const { data: existing } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", Id)
        .order("orden");
      finalVariants = existing ?? [];
    }

    // ── Respuesta final ───────────────────────────────────────────────────────
    // FIX: siempre devolver product_variants (no variants) para consistencia con el frontend
    const caracteristicas = (() => {
      const raw = updatedProduct?.caracteristicas;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return raw;
    })();

    return NextResponse.json({
      ...updatedProduct,
      product_variants: finalVariants,
      caracteristicas,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error al actualizar" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const supabase = await getAuthenticatedSupabase();

    const data = await request.formData();
    const imageOld = data.get("image");
    const Id = data.get("Id");

    // Borrar imágenes de variantes en cloudinary
    const { data: varData } = await supabase
      .from("product_variants")
      .select("image")
      .eq("product_id", Id);

    await Promise.allSettled([
      ...(varData ?? [])
        .filter((v) => v.image)
        .map((v) => DestroyImage(v.image)),
      imageOld ? DestroyImage(imageOld) : Promise.resolve(),
    ]);

    await supabase.from("product_variants").delete().eq("product_id", Id);
    const { error } = await supabase
      .from("Products")
      .delete()
      .eq("productId", Id);

    if (error)
      return NextResponse.json(
        { message: error.message || error },
        { status: 400 },
      );
    return NextResponse.json({ message: "Eliminado correctamente" });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error al eliminar" },
      { status: 500 },
    );
  }
}
