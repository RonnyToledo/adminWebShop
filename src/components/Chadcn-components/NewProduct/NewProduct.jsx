"use client";
import React from "react";
import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { logoApp } from "@/utils/image";
import { toast } from "sonner";
import { ProductEditForm } from "../product-edit-form";
import { extractBlobFilesFromArray } from "@/components/globalFunction/extractBlobFilesFromArray";

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
};
export default function NewProduct({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const form = useRef(null);
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
      toast.error(
        "Configuración de tienda incompleta. Revisa los datos de la tienda."
      );
      return;
    }

    if (!products?.title || products.title.trim() === "") {
      toast.error("El producto necesita un título.");
      return;
    }
    const imagesecondary = products?.imagesecondary.filter(
      (obj) => obj !== logoApp
    );
    const imagesecondaryWebshop = [];
    // Construir FormData
    const formData = new FormData();
    formData.append("title", String(products.title ?? ""));
    formData.append("price", String(products.price ?? ""));
    formData.append("visible", String(products.visible ?? ""));
    formData.append("UID", String(webshop?.store?.UUID));
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
      JSON.stringify(products.caracteristicas ?? [])
    );
    formData.append("agregados", JSON.stringify(products.agregados ?? []));
    formData.append("imagesecondary", JSON.stringify(imagesecondary));

    formData.append(
      "imagesecondaryCopy",
      JSON.stringify(imagesecondaryWebshop)
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
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // si tienes un estado para progreso, actualízalo (opcional)
          // setUploadProgress(percent);
          console.debug("Upload progress:", percent, "%");
        },
      }
    );

    try {
      // toast.promise mostrará loading / success / error automáticamente.
      const res = toast.promise(postPromise, {
        loading: "Creando producto...",
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
            return response?.data?.message ?? "Producto creado correctamente";
          }

          // Si el servidor respondió con otro código, devolvemos mensaje
          return `Respuesta inesperada del servidor: ${response?.status}`;
        },
        error: (err) => {
          // Mensaje legible para el toast de error
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo crear el producto";
          return `Error: ${msg}`;
        },
      });

      // opcional: devolver la respuesta si se necesita más manejo
      return res;
    } catch (err) {
      // El toast ya ha mostrado el error; log para debug
      console.error("Error al crear producto:", err);
    }
  };

  useEffect(() => {
    setProducts((prev) => ({ ...prev, image: newImage }));
  }, [newImage]);

  return (
    <main className=" mx-auto  px-4 sm:px-6 lg:px-8 ">
      <ProductEditForm
        product={products}
        isCreating={true}
        onProductChange={setProducts}
        newImage={newImage}
        setNewImage={setNewImage}
      />
      <div className="bg-white p-2 flex justify-center sticky bottom-0 w-full">
        <Button
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl`}
          onClick={() => handleSubmit()}
        >
          {"Guardar"}
        </Button>
      </div>
    </main>
  );
}
