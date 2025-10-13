"use client";

import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import ConfimationOut from "@/components/globalFunction/confimationOut";
import { logoApp } from "@/utils/image";
import { extractBlobFilesFromArray } from "@/components/globalFunction/extractBlobFilesFromArray";
import { ProductEditForm } from "../product-edit-form";
import { toast } from "sonner";

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

  // añade aquí otras propiedades que uses en los inputs
};

export default function Specific({ specific, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);

  // inicializar con defaultProduct para que products NUNCA sea undefined
  const [products, setProducts] = useState(defaultProduct);
  const [newImage, setNewImage] = useState(null);

  // Seguro: buscar producto y merge con defaultProduct para tener siempre las props
  useEffect(() => {
    setProducts(
      webshop?.products?.find((prod) => prod.productId === specific) ??
        defaultProduct
    );
  }, [webshop?.products, specific]);

  /**
   * SaveData: envía la edición de un producto (incluye imágenes secundarias nuevas).
   * - No forzamos Content-Type (el navegador añade el boundary).
   * - Usa toast.promise para UX consistente.
   * - Maneja progreso de subida (onUploadProgress) opcionalmente.
   */
  async function SaveData() {
    setDownloading(true);

    // Validaciones iniciales
    if (!webshop?.store?.sitioweb) {
      toast.error("La configuración de la tienda no está completa.");
      setDownloading(false);
      return;
    }
    if (!products?.productId) {
      toast.error("Producto inválido o falta productId.");
      setDownloading(false);
      return;
    }

    try {
      // Normalizaciones / conversions numéricas y booleanas
      const price = Number(products.price) || 0;
      const oldPriceNum = Number(products.oldPrice) || 0;
      const priceCompra = Number(products.priceCompra) || 0;
      const embalaje = Number(products.embalaje) || 0;
      const stock = Number(products.stock) || 0;
      const order = products.order;
      const favorito = !!products.favorito;
      const visible = !!products.visible;
      const span = !!products.span;

      // recalculo seguro de oldPrice: solo si hay oldPrice numérico y price < oldPrice
      const oldPriceVal =
        price < oldPriceNum && oldPriceNum > 0 ? oldPriceNum : 0;

      // Filtramos imagesecondary local (eliminando logoApp si aplica)
      const imagesecondary = (products?.imagesecondary ?? []).filter(
        (obj) => obj !== logoApp
      );

      // imagesecondary actual que hay en el webshop
      const imagesecondaryWebshop =
        webshop?.products?.find(
          (obj) =>
            String(obj.productId) === String(specific ?? products.productId)
        )?.imagesecondary ?? [];

      // Construcción de FormData
      const formData = new FormData();
      formData.append("title", String(products.title ?? ""));
      formData.append("descripcion", String(products.descripcion ?? ""));
      formData.append("price", String(price));
      formData.append("priceCompra", String(priceCompra));
      formData.append("oldPrice", String(oldPriceVal));
      formData.append("embalaje", String(embalaje));
      formData.append("venta", String(!!products.venta));
      formData.append("order", String(order));
      formData.append("caja", String(products.caja ?? ""));
      formData.append(
        "caracteristicas",
        JSON.stringify(products?.caracteristicas ?? [])
      );
      formData.append("favorito", String(favorito));
      formData.append("stock", String(stock));
      formData.append("creado", String(products.creado ?? ""));
      formData.append("default_moneda", String(products.default_moneda ?? ""));
      formData.append(
        "storeId",
        String(products.storeId ?? webshop?.store?.UUID ?? "")
      );
      formData.append("visible", String(visible));
      formData.append("Id", String(products.productId ?? ""));
      formData.append("span", String(span));
      // Si products.image contiene una URL, la dejamos; si contiene un File, ya lo añadiremos más abajo.
      if (products.image && !(products.image instanceof File)) {
        formData.append("image", String(products.image));
      }
      formData.append("imagesecondary", JSON.stringify(imagesecondary));
      formData.append("agregados", JSON.stringify(products?.agregados ?? []));
      formData.append(
        "imagesecondaryCopy",
        JSON.stringify(imagesecondaryWebshop)
      );

      // Si las secundarias han cambiado, extraemos blobs y las añadimos al FormData
      if (
        JSON.stringify(imagesecondaryWebshop) !== JSON.stringify(imagesecondary)
      ) {
        // extractBlobFilesFromArray debe devolver [{ index, file, previewUrl }, ...]
        const value = await extractBlobFilesFromArray(imagesecondary, {
          filenamePrefix: "prod",
          revokeObjectURL: true,
        });

        if (Array.isArray(value) && value.length > 0) {
          const meta = value.map((v) => ({
            index: v.index,
            filename: v.file?.name ?? null,
            previewUrl: v.previewUrl ?? null,
          }));

          formData.append("NewImagesSecondaryMeta", JSON.stringify(meta));

          // Añadimos todos los File reales (mismo key -> server debe usar getAll)
          value.forEach((v) => {
            if (v.file instanceof File) {
              formData.append("newImageSecondaryFiles", v.file, v.file.name);
            }
          });
        }
      }

      // Si hay una newImage (archivo), la añadimos explícitamente.
      // Si además quieres mantener la URL previa, ya la añadimos más arriba como string.
      if (newImage instanceof File) {
        formData.append("newImage", newImage, newImage.name);
        // si quieres enviar también el nombre/url anterior, se ha añadido en "image" cuando era string
      }

      // Construimos la promesa axios (sin forzar header Content-Type).
      const putPromise = axios.put(
        `/api/tienda/${webshop.store.sitioweb}/products/${products.productId}/`,
        formData,
        {
          withCredentials: true,
          // onUploadProgress opcional para mostrar barra de progreso
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const pct = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              // Si tienes estado de progreso, úsalo:
              // setUploadProgress(pct);
              console.debug("Upload progress:", pct, "%");
            }
          },
        }
      );

      // Usamos toast.promise para manejar la UX
      const res = toast.promise(putPromise, {
        loading: "Actualizando producto...",
        success: (response) => {
          // Extraemos la entidad actualizada (compatibilidad con distintos formatos de API)
          const updated = response?.data?.data ?? response?.data ?? null;

          if (!updated) {
            // Si no vino el recurso actualizado, avisamos y no tocamos el estado (o podríamos aplicar fallback)
            return (
              response?.data?.message ??
              "Producto actualizado (sin datos devueltos)."
            );
          }

          // Actualizamos webshop de forma inmutable: sustituimos solo el producto afectado
          setWebshop((prev) => ({
            ...prev,
            products: (prev?.products ?? []).map((p) =>
              String(p.productId) === String(updated.productId) ? updated : p
            ),
          }));

          setNewImage(null);
          // setUploadProgress(0);
          // Mensaje de éxito que se mostrará en el toast
          return (
            response?.data?.message ?? "Producto actualizado correctamente"
          );
        },
        error: (err) => {
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo actualizar el producto";
          return `Error: ${msg}`;
        },
      });

      return res;
    } catch (err) {
      // Si hay un error antes de la promesa (p. ej. extractBlobFilesFromArray lanzó),
      // mostramos un toast y lo logueamos.
      console.error("SaveData error:", err);
      toast.error(err?.message ?? "Error inesperado al preparar el producto.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="grid min-h-screen w-full ">
      <div className="flex flex-col p-3 w-full ">
        <ProductEditForm
          product={products}
          onProductChange={setProducts}
          newImage={newImage}
          changes={hasPendingChanges(
            webshop?.products?.find((obj) => obj.productId == specific),
            products
          )}
          setNewImage={setNewImage}
        />
        <div className="bg-white p-2 flex justify-center sticky bottom-0 w-full">
          <Button
            className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading}
            onClick={() => SaveData()}
          >
            {downloading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <ConfimationOut
        action={hasPendingChanges(
          webshop?.products?.find((obj) => obj.productId == specific),
          products
        )}
      />
    </main>
  );
}

// Utilidad y helpers
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
