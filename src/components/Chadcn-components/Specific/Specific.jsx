"use client";
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
import ProductEditForm from "../Products/product-edit-form";
import { toast } from "sonner";
import { hasChanged } from "@/utils/hasChanges";

// Sin "image" ni "imagesecondary": la foto (principal y única, por ahora)
// vive en product_variants (variante default). imagesecondary no se usa
// actualmente.
const defaultProduct = {
  productId: null,
  title: "",
  descripcion: "",
  order: "",
  caja: "",
  favorito: false,
  visible: true,
  span: false,
  caracteristicas: [],
  combos: [],
  publish_at: null,
  default_moneda: "",
  product_variants: [],
};

export default function Specific({ specific, ThemeContext, initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [products, setProducts] = useState(defaultProduct);
  const [variantImageBlobs, setVariantImageBlobs] = useState(new Map());

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  useEffect(() => {
    const found = webshop?.products?.find((p) => p.productId === specific);
    if (!found) {
      setProducts(defaultProduct);
      return;
    }

    setProducts({
      ...found,
      product_variants: found.product_variants ?? found.variants ?? [],
      combos: found.combos ?? [],
    });
  }, [webshop?.products, specific]);

  async function SaveData(publishAtOverride) {
    setDownloading(true);

    if (!webshop?.store?.sitioweb || !products?.productId) {
      toast.error("Error", {
        description: "Información incompleta.",
      });
      setDownloading(false);
      return;
    }

    try {
      // ── old_price se lee desde la variante default, no del producto raíz
      const defaultVariantCurrent = (products.product_variants ?? []).find(
        (v) => v.attributes?.es_default === true || v.default_variant === true,
      );
      const oldPriceVal = Number(defaultVariantCurrent?.old_price) || 0;
      const rawPublishAt = publishAtOverride ?? products.publish_at;
      const publishAtDate = rawPublishAt ? new Date(rawPublishAt) : null;
      const publishAt =
        publishAtDate && !Number.isNaN(publishAtDate.getTime())
          ? publishAtDate.toISOString()
          : "";

      const formData = new FormData();
      formData.append("title", String(products.title ?? ""));
      formData.append("descripcion", String(products.descripcion ?? ""));
      formData.append("oldPrice", String(oldPriceVal));
      formData.append("venta", String(!!products.venta));
      formData.append("order", String(products.order));
      formData.append("caja", String(products.caja ?? ""));
      formData.append("combos", JSON.stringify(products.combos ?? []));
      formData.append(
        "info_sections",
        JSON.stringify(products.info_sections ?? []),
      );
      formData.append(
        "caracteristicas",
        JSON.stringify(products?.caracteristicas ?? []),
      );
      formData.append("favorito", String(!!products.favorito));
      formData.append("creado", String(products.creado ?? ""));
      formData.append("default_moneda", String(products.default_moneda ?? ""));
      formData.append(
        "storeId",
        String(products.storeId ?? webshop?.store?.UUID ?? ""),
      );
      formData.append("visible", String(!!products.visible));
      formData.append("publish_at", publishAt);
      formData.append("Id", String(products.productId ?? ""));
      formData.append("span", String(!!products.span));
      formData.append(
        "modified_extract",
        products.info_sections !==
          webshop?.products?.find((p) => p.productId === specific)
            ?.info_sections,
      );

      const productVariants = products.product_variants ?? [];

      const cleanVariants = productVariants.map(
        ({ _localPreview, _deleteImage, ...rest }) => rest,
      );
      formData.append("variants", JSON.stringify(cleanVariants));

      const toDelete = productVariants
        .filter((v) => v._deleteImage)
        .map((v) => v._deleteImage);
      formData.append("variantImageDelete", JSON.stringify(toDelete));

      const variantMeta = [];
      for (const [variantId, file] of variantImageBlobs.entries()) {
        const filename = `variant_${variantId}_${file.name}`;
        variantMeta.push({ variantId, filename });
        formData.append("variantImageFiles", file, filename);
      }
      formData.append("variantImageMeta", JSON.stringify(variantMeta));

      const putPromise = axios.put(
        `/api/tienda/${webshop.store.sitioweb}/products/${products.productId}/`,
        formData,
        { withCredentials: true },
      );

      await toast.promise(putPromise, {
        loading: "Actualizando producto...",
        success: (response) => {
          const updated = response?.data?.data ?? response?.data ?? null;
          if (!updated) return "Actualizado";

          const normalizedUpdated = {
            ...updated,
            product_variants:
              updated.product_variants ?? updated.variants ?? [],
          };

          setWebshop((prev) => ({
            ...prev,
            products: (prev?.products ?? []).map((p) =>
              String(p.productId) === String(normalizedUpdated.productId)
                ? normalizedUpdated
                : p,
            ),
          }));
          setVariantImageBlobs(new Map());

          return "Producto actualizado";
        },
        error: (err) =>
          err?.response?.data?.message ?? err?.message ?? "Error al actualizar",
      });
    } catch (err) {
      console.error("SaveData error:", err);
      toast.error("Error", { description: err?.message });
    } finally {
      setDownloading(false);
    }
  }

  const originalProduct = webshop?.products?.find(
    (p) => p.productId === specific,
  );

  const hasChanges =
    !!originalProduct &&
    hasChanged(
      {
        ...products,
        product_variants: products.product_variants ?? products.variants ?? [],
      },
      {
        ...originalProduct,
        product_variants:
          originalProduct.product_variants ?? originalProduct.variants ?? [],
      },
    );

  return (
    <main className="grid min-h-screen w-full min-w-0">
      <div className="flex min-w-0 flex-col p-3 w-full">
        <ProductEditForm
          product={products}
          onProductChange={setProducts}
          hasChanges={hasChanges}
          saving={downloading}
          variantImageBlobs={variantImageBlobs}
          setVariantImageBlobs={setVariantImageBlobs}
          onSave={SaveData}
        />
      </div>
      <ConfirmationOut action={hasChanges} />
    </main>
  );
}
