"use client";
import React, { useRef, useState, useContext } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "../ui/button";
import { sileo } from "sileo";

export function FromData({ children, store, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const form = useRef(null);
  async function handleSubmit(e) {
    e.preventDefault();
    setDownloading(true);
    // Construir FormData
    const formData = new FormData();

    Object.entries(store).forEach(([key, value]) => {
      if (value instanceof File || value instanceof Blob) {
        // Archivos: añadir tal cual
        formData.append(key, value);
      } else if (value && typeof value === "object") {
        // Objetos: stringify
        formData.append(key, JSON.stringify(value));
      } else {
        // Primitivos: asegurar string (evitar undefined/null)
        formData.append(key, String(value ?? ""));
      }
    });

    // Promesa de la petición PUT (no forzamos Content-Type)
    const putPromise = apiClient.put(`/api/tienda/${store.sitioweb}/`, formData);

    try {
      const res = sileo.promise(putPromise, {
        loading: { title: "Actualizando configuración..." },
        success: (response) => {
          // Actualizamos el estado local con el store nuevo
          setWebshop((prev) => ({
            ...prev,
            store: { ...store, monedas: response.data.data[0].monedas },
          }));

          // Reseteamos el formulario si existe la referencia
          if (
            form &&
            form.current &&
            typeof form.current.reset === "function"
          ) {
            form.current.reset();
          }

          // Mensaje de éxito (puedes usar response.data para mensajes del backend)
          return {
            title: "Éxito",
            description:
              response?.data?.message ??
              "Configuración actualizada correctamente",
          };
        },
        error: (err) => {
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo actualizar la configuración";
          return {
            title: "Error",
            description: `Error: ${msg}`,
          };
        },
      });

      // opcional: devolver la respuesta para quien llame a handleSubmit
      return res;
    } catch (err) {
      console.error("handleSubmit error:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <form
      ref={form}
      className="grid gap-6 min-h-screen"
      onSubmit={handleSubmit}
    >
      {children}
      <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
        <Button
          type="submit"
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl disabled:bg-gray-500 ${
            downloading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={downloading}
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
