"use client";
import React, { useRef, useState, useContext } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { serializeForComparison } from "@/utils/hasChanges";
import { useRouter } from "next/navigation";

function normalizeMonedasForSubmit(monedas) {
  if (!Array.isArray(monedas)) return [];

  return monedas.map((moneda) => {
    const rawValor = moneda?.valor ?? 1;
    const parsedValor = Number.parseFloat(String(rawValor).replace(",", "."));

    return {
      ...moneda,
      nombre: String(moneda?.nombre ?? "").trim() || "Moneda",
      valor:
        Number.isFinite(parsedValor) && parsedValor > 0
          ? Number(parsedValor.toFixed(6))
          : 1,
      defecto: Boolean(moneda?.defecto),
    };
  });
}

export function FromData({ children, store, ThemeContext }) {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const form = useRef(null);
  const originalStore = useRef(serializeForComparison(store));
  const hasPendingChanges =
    serializeForComparison(store) !== originalStore.current;

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
      } else if (key === "monedas" && Array.isArray(value)) {
        formData.append(
          "monedas",
          JSON.stringify(normalizeMonedasForSubmit(value)),
        );
      } else if (value && typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value ?? ""));
      }
    });
    const putPromise = fetch(
      apiClient.getUri({ url: `/api/tienda/${store.sitioweb}/` }),
      {
        method: "PUT",
        body: formData,
        credentials: "include",
      },
    ).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(
          data?.message ?? "No se pudo actualizar la configuración",
        );
        error.response = { data };
        throw error;
      }
      return { data };
    });

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
          originalStore.current = serializeForComparison(store);
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
      router.refresh();
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
          disabled={downloading || !hasPendingChanges}
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
