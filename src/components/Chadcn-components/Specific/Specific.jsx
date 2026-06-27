"use client";
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
import { logoApp } from "@/utils/image";
import { extractBlobFilesFromArray } from "@/components/globalFunction/extractBlobFilesFromArray";
import ProductEditForm from "../Products/product-edit-form";
import { toast } from "sonner";
import Image from "next/image";

const defaultProduct = {
  productId: null,
  title: "",
  descripcion: "",
  price: "",
  order: "",
  caja: "",
  favorito: false,
  stock: 1,
  visible: true,
  span: false,
  image: "",
  imagesecondary: [logoApp, logoApp, logoApp],
  caracteristicas: [],
  oldPrice: "",
  priceCompra: 0,
  combos: [],
  default_moneda: "",
  product_variants: [],
};

export default function Specific({ specific, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [products, setProducts] = useState(defaultProduct);
  const [newImage, setNewImage] = useState(null);
  const [variantImageBlobs, setVariantImageBlobs] = useState(new Map());

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

  async function SaveData() {
    setDownloading(true);

    if (!webshop?.store?.sitioweb || !products?.productId) {
      toast.error("Error", {
        description: "Información incompleta.",
      });
      setDownloading(false);
      return;
    }

    try {
      const price = Number(products.price) || 0;
      const priceCompra = Number(products.priceCompra) || 0;

      // ── FIX: leer old_price desde la variante default, no del producto raíz
      const defaultVariantCurrent = (products.product_variants ?? []).find(
        (v) => v.attributes?.es_default === true || v.default_variant === true,
      );
      const oldPriceVal = Number(defaultVariantCurrent?.old_price) || 0;

      const imagesecondary = (products?.imagesecondary ?? []).filter(
        (o) => o !== logoApp,
      );
      const imagesecondaryWebshop =
        webshop?.products?.find((p) => p.productId === specific)
          ?.imagesecondary ?? [];

      const formData = new FormData();
      formData.append("title", String(products.title ?? ""));
      formData.append("descripcion", String(products.descripcion ?? ""));
      formData.append("price", String(price));
      formData.append("priceCompra", String(priceCompra));
      formData.append("oldPrice", String(oldPriceVal));
      formData.append("embalaje", String(Number(products.embalaje) || 0));
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
      formData.append("stock", String(Number(products.stock) || 0));
      formData.append("creado", String(products.creado ?? ""));
      formData.append("default_moneda", String(products.default_moneda ?? ""));
      formData.append(
        "storeId",
        String(products.storeId ?? webshop?.store?.UUID ?? ""),
      );
      formData.append("visible", String(!!products.visible));
      formData.append("Id", String(products.productId ?? ""));
      formData.append("span", String(!!products.span));
      formData.append(
        "modified_extract",
        products.info_sections !==
          webshop?.products?.find((p) => p.productId === specific)
            ?.info_sections,
      );

      formData.append("imagesecondary", JSON.stringify(imagesecondary));
      formData.append(
        "imagesecondaryCopy",
        JSON.stringify(imagesecondaryWebshop),
      );

      if (products.image && !(products.image instanceof File)) {
        formData.append("image", String(products.image));
      }

      if (newImage instanceof File) {
        formData.append("newImage", newImage, newImage.name);
      }

      if (
        JSON.stringify(imagesecondaryWebshop) !== JSON.stringify(imagesecondary)
      ) {
        const blobFiles = await extractBlobFilesFromArray(imagesecondary, {
          filenamePrefix: "prod",
          revokeObjectURL: true,
        });
        if (blobFiles.length > 0) {
          formData.append(
            "NewImagesSecondaryMeta",
            JSON.stringify(
              blobFiles.map((v) => ({
                index: v.index,
                filename: v.file.name,
                previewUrl: v.previewUrl ?? null,
              })),
            ),
          );
          blobFiles.forEach((v) =>
            formData.append("newImageSecondaryFiles", v.file, v.file.name),
          );
        }
      }

      const productVariants = products.product_variants ?? [];

      const cleanVariants = productVariants.map(
        // eslint-disable-next-line no-unused-vars
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

      toast.promise(putPromise, {
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
          setNewImage(null);
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

  const hasChanges = (() => {
    if (!originalProduct) return false;
    const orig = JSON.stringify({
      ...originalProduct,
      product_variants:
        originalProduct.product_variants ?? originalProduct.variants ?? [],
    });
    const curr = JSON.stringify(products);
    return orig !== curr;
  })();

  return (
    <main className="grid min-h-screen w-full">
      <div className="flex flex-col p-3 w-full">
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
