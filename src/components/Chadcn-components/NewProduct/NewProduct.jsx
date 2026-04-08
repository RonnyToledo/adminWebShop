"use client";
import React from "react";
import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { logoApp } from "@/utils/image";
import { sileo } from "sileo";
import { ProductEditForm } from "../product-edit-form";
import { extractBlobFilesFromArray } from "@/components/globalFunction/extractBlobFilesFromArray";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Image from "next/image";
import PlanGuard from "../Planes/PlanGuard";

const initialCase = {
  venta: true,
  span: false,
  title: "",
  descripcion: "",
  discount: 0,
  caracteristicas: [],
  priceCompra: 0,
  imagesecondary: [logoApp, logoApp, logoApp],
  stock: 1,
  visible: true,
  price: 0,
  embalaje: 0,
  agregados: [],
  default_moneda: "",
};
export default function NewProduct({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const form = useRef(null);
  const router = useRouter();
  const [newImage, setNewImage] = useState(null);
  const [products, setProducts] = useState(initialCase);

  function getLocalISOString(date) {
    const offset = date.getTimezoneOffset(); // Obtiene el desfase en minutos
    const localDate = new Date(date.getTime() - offset * 60000); // Ajusta la fecha a UTC
    return localDate.toISOString().slice(0, 19); // Formato "YYYY-MM-DDTHH:mm:ss"
  }

  const handleSubmit = async (e) => {
    // timestamp
    const now = new Date();
    // Validaciones mínimas
    if (!webshop?.store?.sitioweb || !webshop?.store?.UUID) {
      sileo.error({
        title: "Configuración de tienda incompleta",
        description: "Revisa los datos de la tienda.",
      });
      router.refresh();
      return;
    }
    if (!products?.title || products.title.trim() === "") {
      sileo.error({
        title: "Producto sin título",
        description: "El producto necesita un título.",
      });
      return;
    }
    if (!products?.price || isNaN(products.price) || products.price < 0) {
      sileo.error({
        title: "Precio inválido",
        description: "El producto necesita un precio válido.",
      });
      return;
    }
    if (!products?.caja || products.title.trim() === "") {
      sileo.error({
        title: "Categoría no seleccionada",
        description: "Se necesita seleccionar una categoría.",
      });
      return;
    }
    if (products.priceCompra > products.price) {
      sileo.error({
        title: "Precio de compra inválido",
        description:
          "El precio de compra no puede ser mayor al precio de venta.",
      });
      return;
    }
    const imagesecondary = products?.imagesecondary.filter(
      (obj) => obj !== logoApp,
    );
    const imagesecondaryWebshop = [];
    // Construir FormData
    const formData = new FormData();
    formData.append("title", String(products.title ?? ""));
    formData.append("price", String(products.price ?? ""));
    formData.append("visible", String(products.visible ?? ""));
    formData.append("UID", String(webshop?.store?.UUID));
    formData.append(
      "default_moneda",
      String(products.default_moneda || webshop?.store?.default_moneda),
    );
    formData.append("order", String(10000));
    formData.append("stock", String(products.stock));
    formData.append("oldPrice", String(products.oldPrice ?? ""));
    formData.append("priceCompra", String(products.priceCompra ?? ""));
    formData.append("embalaje", String(products.embalaje ?? ""));
    formData.append("caja", String(products.caja ?? ""));
    formData.append("venta", String(products.venta ?? false));
    formData.append("descripcion", String(products.descripcion ?? ""));
    formData.append("span", String(products.span ?? ""));
    formData.append(
      "caracteristicas",
      JSON.stringify(products.caracteristicas ?? []),
    );
    formData.append("agregados", JSON.stringify(products.agregados ?? []));
    formData.append("imagesecondary", JSON.stringify(imagesecondary));

    formData.append(
      "imagesecondaryCopy",
      JSON.stringify(imagesecondaryWebshop),
    );
    if (
      JSON.stringify(imagesecondaryWebshop) !== JSON.stringify(imagesecondary)
    ) {
      const value = await extractBlobFilesFromArray(imagesecondary, {
        filenamePrefix: "prod",
        revokeObjectURL: true,
      });
      // metadata: index + filename + previewUrl (para mapear en server)
      const meta = value.map((v) => ({
        index: v.index,
        filename: v.file.name,
        previewUrl: v.previewUrl ?? null,
      }));

      // agregamos metadata como JSON (pequeño y seguro)
      formData.append("NewImagesSecondaryMeta", JSON.stringify(meta));

      // agregamos cada File real al FormData (no serializar)
      value.forEach((v) => {
        // igual key para todos -> getAll en server
        formData.append("newImageSecondaryFiles", v.file, v.file.name);
      });
    }
    formData.append("UID", String(webshop.store.UUID));
    formData.append("creado", getLocalISOString(now));
    if (products.image) formData.append("image", products.image);

    // Promise de la petición POST
    const postPromise = axios.post(
      `/api/tienda/${webshop.store.sitioweb}/products`,
      formData,
      {
        // No poner "Content-Type": multipart/form-data aquí; el browser lo gestiona.
        withCredentials: true, // si necesitas enviar cookies
        // onUploadProgress opcional para mostrar progreso:
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          // si tienes un estado para progreso, actualízalo (opcional)
          // setUploadProgress(percent);
          console.debug("Upload progress:", percent, "%");
        },
      },
    );

    try {
      const res = sileo.promise(postPromise, {
        loading: {
          title: "Creando producto...",
          description: "Por favor espera mientras se crea el producto.",
        },
        success: (response) => {
          // Aceptamos status 200 o 201
          if (response?.status === 200 || response?.status === 201) {
            // Extraer el producto devuelto por el backend:
            // preferimos response.data.data (si tu API sigue ese patrón),
            // si no existe, fallback a response.data

            const createdProduct =
              response?.data?.data ?? response?.data ?? null;
            // Actualizamos el estado de forma inmutable
            setWebshop((prev) => ({
              ...prev,
              products: [...(prev?.products ?? []), createdProduct],
            }));

            // Reset del formulario y estados relacionados
            form.current?.reset();
            setProducts({ ...products, ...initialCase } ?? {}); // restablece al estado inicial
            setNewImage(null);
            // setUploadProgress(0); // si usaste progreso
            return {
              title: "Producto creado correctamente",
              description: (
                <div className="flex flex-col gap-3">
                  {/* Product card detail */}
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-2.5">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image
                        src={products.image || logoApp}
                        alt={products.title}
                        height={50}
                        width={50}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {products.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {webshop?.store?.categoria?.find(
                          (c) => c.id === products.caja,
                        )?.name || "Categoría no encontrada"}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-foreground">
                          $ {Number(products.price).toFixed(2)}{" "}
                        </span>
                      </div>
                    </div>

                    {/* Animated badge */}
                    <span className="rounded-md bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-foreground">
                      {!products.visible
                        ? "Inactivo"
                        : products.stock === 0
                          ? "Agotado"
                          : "Activo"}
                    </span>
                  </div>
                </div>
              ),
            };
          }

          // Si el servidor respondió con otro código, devolvemos mensaje
          return {
            title: "Error inesperado",
            description: `Respuesta inesperada del servidor: ${response?.status}`,
          };
        },
        error: (err) => {
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo crear el producto";
          return { title: "Error al crear producto", description: msg };
        },
      });

      // opcional: devolver la respuesta si se necesita más manejo
      return res;
    } catch (err) {
      sileo.error({
        title: "Error al crear producto",
        description:
          err?.response?.data?.message ??
          err?.message ??
          "No se pudo crear el producto",
      });
      console.error("Error al crear producto:", err);
    }
  };

  useEffect(() => {
    setProducts((prev) => ({ ...prev, image: newImage }));
  }, [newImage]);

  return (
    <main className=" mx-auto  px-4 sm:px-6 lg:px-8 ">
      <ProductEditForm
        product={{
          ...products,
          default_moneda:
            webshop?.store?.monedas.find((currency) => currency.defecto)?.id ??
            "",
        }}
        changess={true}
        onProductChange={setProducts}
        newImage={newImage}
        setNewImage={setNewImage}
      />

      <div className="bg-white p-2 flex justify-center sticky bottom-0 w-full">
        <PlanGuard feature={"productos"}>
          <Button
            className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl`}
            onClick={() => handleSubmit()}
          >
            {"Guardar"}
          </Button>
        </PlanGuard>
      </div>
    </main>
  );
}
