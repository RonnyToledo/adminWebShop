"use client";
import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
import { logoApp } from "@/utils/image";
import { extractBlobFilesFromArray } from "@/components/globalFunction/extractBlobFilesFromArray";
import ProductEditForm from "../Products/product-edit-form";
import { sileo } from "sileo";
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
  default_moneda: "",
  // FIX: usar product_variants como campo canónico (coincide con ProductEditForm y la DB)
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

    // FIX: normalizar el campo de variantes al nombre canónico `product_variants`
    // La API puede devolver `variants` o `product_variants` según la query
    setProducts({
      ...found,
      product_variants: found.product_variants ?? found.variants ?? [],
    });
  }, [webshop?.products, specific]);

  async function SaveData() {
    setDownloading(true);

    if (!webshop?.store?.sitioweb || !products?.productId) {
      sileo.error({ title: "Error", description: "Información incompleta." });
      setDownloading(false);
      return;
    }

    try {
      const price = Number(products.price) || 0;
      const oldPriceNum = Number(products.oldPrice) || 0;
      const priceCompra = Number(products.priceCompra) || 0;
      const oldPriceVal =
        price < oldPriceNum && oldPriceNum > 0 ? oldPriceNum : 0;

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
      formData.append("imagesecondary", JSON.stringify(imagesecondary));
      formData.append(
        "imagesecondaryCopy",
        JSON.stringify(imagesecondaryWebshop),
      );

      // Imagen principal actual (string url) o null
      if (products.image && !(products.image instanceof File)) {
        formData.append("image", String(products.image));
      }

      // Imagen principal nueva (File)
      if (newImage instanceof File) {
        formData.append("newImage", newImage, newImage.name);
      }

      // Imágenes secundarias nuevas (blob)
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

      // FIX: usar product_variants como campo canónico
      const productVariants = products.product_variants ?? [];

      // Limpiar campos internos de UI antes de serializar
      const cleanVariants = productVariants.map(
        // eslint-disable-next-line no-unused-vars
        ({ _localPreview, _deleteImage, ...rest }) => rest,
      );
      formData.append("variants", JSON.stringify(cleanVariants));

      // URLs de imágenes de variantes a borrar en cloudinary
      const toDelete = productVariants
        .filter((v) => v._deleteImage)
        .map((v) => v._deleteImage);
      formData.append("variantImageDelete", JSON.stringify(toDelete));

      // FIX: imágenes nuevas de variantes desde el Map de blobs
      // El Map usa el UUID de la variante como clave
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

      sileo.promise(putPromise, {
        loading: { title: "Actualizando producto..." },
        success: (response) => {
          const updated = response?.data?.data ?? response?.data ?? null;
          if (!updated)
            return {
              title: "Actualizado",
              description: "Sin datos devueltos.",
            };

          // FIX: normalizar product_variants en la respuesta antes de actualizar el store
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

          return {
            title: "Producto actualizado",
            description: (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-2.5">
                <Image
                  src={products.image || logoApp}
                  alt={products.title}
                  height={50}
                  width={50}
                  className="rounded-md object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{products.title}</p>
                </div>
              </div>
            ),
          };
        },
        error: (err) => ({
          title: "Error al actualizar",
          description: err?.response?.data?.message ?? err?.message,
        }),
      });
    } catch (err) {
      console.error("SaveData error:", err);
      sileo.error({ title: "Error", description: err?.message });
    } finally {
      setDownloading(false);
    }
  }

  const originalProduct = webshop?.products?.find(
    (p) => p.productId === specific,
  );

  // FIX: comparar con product_variants normalizado para detectar cambios correctamente
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
  console.log(products);
  return (
    <main className="grid min-h-screen w-full">
      <div className="flex flex-col p-3 w-full">
        <ProductEditForm
          product={products}
          onProductChange={setProducts}
          changes={hasChanges}
          variantImageBlobs={variantImageBlobs}
          setVariantImageBlobs={setVariantImageBlobs}
          SaveData={SaveData}
          downloading={downloading}
        />
      </div>
      <ConfirmationOut action={hasChanges} />
    </main>
  );
}
