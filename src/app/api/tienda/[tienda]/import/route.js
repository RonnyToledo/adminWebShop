// api/tienda/[tienda]/products/import/route.js
import { NextResponse } from "next/server";
import {
  createRouteSupabase,
  requireRouteUser,
} from "@/lib/route-handler-auth";

const BATCH_SIZE = 10;

/**
 * Importación masiva de productos.
 *
 * Diferencias intencionales respecto a POST /products (creación individual):
 *  - NO llama a GeminiAsk (no tiene sentido pagar/latencia por cada fila de
 *    un catálogo de cientos de productos; la descripción viene tal cual del
 *    archivo o vacía).
 *  - No maneja combos ni quantity_discounts (se agregan después, producto
 *    por producto, desde ProductEditForm si hace falta).
 *  - Procesa en lotes de BATCH_SIZE con Promise.allSettled, así un producto
 *    con error no detiene el resto de la importación.
 *
 * Body esperado:
 * {
 *   storeId: "uuid-de-la-tienda",
 *   products: [
 *     {
 *       title, caja, default_moneda, venta, visible, span, descripcion,
 *       caracteristicas: [], info_sections: [], combos: [],
 *       product_variants: [{ label, attributes, price, old_price, stock, image, default_variant }]
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request) {
  try {
    let supabase;
    try {
      ({ supabase } = await requireRouteUser());
    } catch {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, products } = body ?? {};

    if (!storeId) {
      return NextResponse.json({ message: "Falta storeId" }, { status: 400 });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { message: "No hay productos para importar" },
        { status: 400 },
      );
    }

    const results = [];
    const errors = [];
    const now = new Date().toISOString();

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const settled = await Promise.allSettled(
        batch.map(async (product, idx) => {
          const rowNumber = i + idx + 1;

          if (!product.title?.trim()) {
            throw {
              row: rowNumber,
              title: product.title,
              message: "Falta el nombre.",
            };
          }
          if (!product.caja) {
            throw {
              row: rowNumber,
              title: product.title,
              message: "Falta la categoría.",
            };
          }

          const variants = product.product_variants ?? [];
          const defaultVariant = variants.find((v) => v.default_variant);
          const price = Number(defaultVariant?.price);
          if (!defaultVariant || !Number.isFinite(price) || price < 0) {
            throw {
              row: rowNumber,
              title: product.title,
              message: "Precio inválido.",
            };
          }

          // ── Crear producto vía la misma RPC que usa la creación individual ──
          const payload = {
            _title: product.title,
            _default_moneda: Number(product.default_moneda ?? 0),
            _caja: product.caja,
            _venta: product.venta ?? true,
            _descripcion: product.descripcion ?? "",
            _span: product.span ?? false,
            _caracteristicas: JSON.stringify(product.caracteristicas ?? []),
            _storeid: storeId,
            _creado: now,
            _order: 10000,
            _visible: product.visible ?? true,
            _info_sections: product.info_sections ?? [],
            _publish_at: product.publish_at
              ? new Date(product.publish_at).toISOString()
              : null,
          };

          const { data: newProduct, error } = await supabase
            .rpc("create_product", payload)
            .single();

          if (error) {
            throw {
              row: rowNumber,
              title: product.title,
              message: error.message,
            };
          }
          if (newProduct?.error) {
            throw {
              row: rowNumber,
              title: product.title,
              message: newProduct.error,
            };
          }

          // ── Insertar variantes ──────────────────────────────────────────
          if (variants.length > 0) {
            const upsertData = variants.map((v) => ({
              product_id: newProduct.productId,
              label: v.label ?? "",
              attributes: v.attributes ?? {},
              price: Number(v.price) || 0,
              old_price: Number(v.old_price) || 0,
              stock: Number(v.stock) || 0,
              image: v.image ?? null,
              default_variant: !!v.default_variant,
            }));

            const { error: varErr } = await supabase
              .from("product_variants")
              .insert(upsertData);

            if (varErr) {
              throw {
                row: rowNumber,
                title: product.title,
                message: varErr.message,
              };
            }
          }

          return {
            row: rowNumber,
            title: product.title,
            productId: newProduct.productId,
          };
        }),
      );

      settled.forEach((r) => {
        if (r.status === "fulfilled") {
          results.push(r.value);
        } else {
          errors.push(
            r.reason ?? {
              row: null,
              title: null,
              message: "Error desconocido",
            },
          );
        }
      });
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error en POST /products/import:", error);
    return NextResponse.json(
      { message: error.message || "Error al importar catálogo" },
      { status: 500 },
    );
  }
}
