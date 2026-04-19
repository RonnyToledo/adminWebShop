"use client";
import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { logoApp } from "@/utils/image";
import { sileo } from "sileo";
import ProductEditForm from "../Products/product-edit-form";
import Image from "next/image";
import PlanGuard from "../Planes/PlanGuard";

// Solo campos que ProductEditForm/VariantsManager realmente escriben
// price/stock/priceCompra/embalaje NO van aquí — viven en product_variants[0]
const initialCase = {
  venta: true,
  span: false,
  title: "",
  descripcion: "",
  caracteristicas: [],
  visible: true,
  default_moneda: 0,
  product_variants: [],
};

export default function NewProduct({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [newImage, setNewImage] = useState(null);
  const [products, setProducts] = useState(initialCase);
  const [variantImageBlobs, setVariantImageBlobs] = useState(new Map());
  const [downloading, setdownloading] = useState(false);

  function getLocalISOString(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 19);
  }

  const handleSubmit = async () => {
    const now = new Date();
    setdownloading(true);

    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      sileo.error({
        title: "Configuración incompleta",
        description: "Revisa los datos de la tienda.",
      });
      return;
    }
    if (!products?.title?.trim()) {
      sileo.error({
        title: "Sin título",
        description: "El producto necesita un título.",
      });
      return;
    }
    if (!products?.caja) {
      sileo.error({
        title: "Sin categoría",
        description: "Selecciona una categoría.",
      });
      return;
    }

    const productVariants = products.product_variants ?? [];

    // La variante default tiene price/stock/priceCompra/embalaje
    const defaultVariant = productVariants.find(
      (v) => v.attributes?.es_default === true || v.default_variant === true,
    );
    const totalPrice = productVariants.some(
      (v) => v.price == null && isNaN(v.price) && v.price == 0,
    );
    console.log(totalPrice, productVariants);
    // Validar que al menos la variante default tenga precio
    if (
      !defaultVariant ||
      defaultVariant.price == null ||
      isNaN(defaultVariant.price) ||
      defaultVariant.price < 0 ||
      totalPrice
    ) {
      sileo.error({
        title: "Precio inválido",
        description: "El producto necesita un precio válido.",
      });
      return;
    }

    const formData = new FormData();

    // ── Campos del producto raíz ──────────────────────────────────────────
    formData.append("title", products.title ?? "");
    formData.append("visible", String(products.visible ?? true));
    formData.append("UID", webshop.store.UUID);
    formData.append(
      "default_moneda",
      String(
        products.default_moneda ||
          webshop?.store?.monedas?.find((m) => m.defecto)?.id,
      ),
    );
    formData.append("order", "10000");
    formData.append("caja", String(products.caja ?? ""));
    formData.append("venta", String(products.venta ?? false));
    formData.append("descripcion", String(products.descripcion ?? ""));
    formData.append("span", String(products.span ?? false));
    formData.append(
      "caracteristicas",
      JSON.stringify(products.caracteristicas ?? []),
    );
    formData.append("creado", getLocalISOString(now));

    // ── Variantes — limpiar campos internos de UI ─────────────────────────
    const cleanVariants = productVariants.map(
      // eslint-disable-next-line no-unused-vars
      ({ _localPreview, _deleteImage, ...rest }) => rest,
    );
    formData.append("variants", JSON.stringify(cleanVariants));

    // ── Imágenes de variantes ─────────────────────────────────────────────
    const variantMeta = [];
    for (const [variantId, file] of variantImageBlobs.entries()) {
      const filename = `variant_${variantId}_${file.name}`;
      variantMeta.push({ variantId, filename });
      formData.append("variantImageFiles", file, filename);
    }
    formData.append("variantImageMeta", JSON.stringify(variantMeta));

    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/products`,
      formData,
      { withCredentials: true },
    );

    sileo.promise(postPromise, {
      loading: {
        title: "Creando producto...",
        description: "Por favor espera.",
      },
      success: (response) => {
        const raw = response?.data?.data ?? response?.data ?? null;

        if (response?.status === 200 || response?.status === 201) {
          // Normalizar siempre a product_variants
          const created = raw
            ? {
                ...raw,
                product_variants: raw.product_variants ?? raw.variants ?? [],
              }
            : null;
          setWebshop((prev) => ({
            ...prev,
            products: [...(prev?.products ?? []), created],
          }));
          setProducts({ ...initialCase });
          setNewImage(null);
          setVariantImageBlobs(new Map());

          return {
            title: "Producto creado correctamente",
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
        }
        return {
          title: "Error inesperado",
          description: `Status: ${response?.status}`,
        };
      },
      error: (err) => ({
        title: "Error al crear producto",
        description: err?.response?.data?.message ?? err?.message,
      }),
    });
    setdownloading(false);
  };

  useEffect(() => {
    setProducts((prev) => ({ ...prev, image: newImage }));
  }, [newImage]);
  console.log(products);
  return (
    <main className="mx-auto px-4 sm:px-6 lg:px-8">
      <ProductEditForm
        product={{
          ...products,
          default_moneda:
            webshop?.store?.monedas?.find((c) => c.defecto)?.id ?? "",
        }}
        changes={true}
        onProductChange={setProducts}
        variantImageBlobs={variantImageBlobs}
        setVariantImageBlobs={setVariantImageBlobs}
        SaveData={handleSubmit}
        downloading={downloading}
      />
    </main>
  );
}
