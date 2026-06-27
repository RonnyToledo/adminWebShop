"use client";
import React, { useRef, useState, useContext } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function FromData({ children, store, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const form = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setDownloading(true);

    const formData = new FormData();

    Object.entries(store).forEach(([key, value]) => {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (key === "horarios" && Array.isArray(value)) {
        // Siempre enviar como "horario" sin importar cómo se llame en el store
        formData.append("horarios", JSON.stringify(value));
      } else if (value && typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value ?? ""));
      }
    });

    const putPromise = apiClient.put(
      `/api/tienda/${store.sitioweb}/`,
      formData,
    );

    try {
      const res = toast.promise(putPromise, {
        loading: "Actualizando configuración...",
        success: (response) => {
          const [updatedSitio] = response.data.data;

          setWebshop((prev) => ({
            ...prev,
            store: {
              ...store,
              monedas: updatedSitio.monedas,
              // horarios raw actualizados; buildHorarioCompleto ya aplicado en actions
              horarios: updatedSitio.horarios,
            },
          }));

          if (form.current?.reset) form.current.reset();

          return (
            "Éxito",
            {
              description:
                response?.data?.message ??
                "Configuración actualizada correctamente",
            }
          );
        },
        error: (err) => {
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "No se pudo actualizar la configuración";
          return ("Error", { description: `Error: ${msg}` });
        },
      });

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
