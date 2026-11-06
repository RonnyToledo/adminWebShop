"use client";
import React, { useRef, useState, useContext, useEffect } from "react";
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

function snapshotStore(store) {
  return Object.fromEntries(
    Object.entries(store).map(([key, value]) => [
      key,
      serializeForComparison(value),
    ]),
  );
}

function getChangedStoreKeys(store, originalSnapshot) {
  const presentationOnlyKeys = new Set(["country", "country_name", "regions"]);
  const keys = new Set([
    ...Object.keys(originalSnapshot),
    ...Object.keys(store),
  ]);
  return [...keys].filter(
    (key) =>
      !presentationOnlyKeys.has(key) &&
      originalSnapshot[key] !== serializeForComparison(store[key]),
  );
}

export function FromData({ children, store, setStore, ThemeContext }) {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const form = useRef(null);
  const submitLock = useRef(false);
  const originalStore = useRef(snapshotStore(store));
  const changedKeys = getChangedStoreKeys(store, originalStore.current);
  const hasPendingChanges = changedKeys.length > 0;

  useEffect(() => {
    if (!downloading) return;

    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [downloading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || changedKeys.length === 0) return;
    submitLock.current = true;
    setDownloading(true);

    try {
      const formData = new FormData();

      changedKeys.forEach((key) => {
        const value = store[key];
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (key === "horarios" && Array.isArray(value)) {
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

      const response = await fetch(
        apiClient.getUri({ url: `/api/tienda/${store.sitioweb}` }),
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        },
      ).then(async (result) => {
        const data = await result.json().catch(() => ({}));
        if (!result.ok) {
          const error = new Error(
            data?.message ?? "No se pudo actualizar la configuración",
          );
          error.response = { data };
          throw error;
        }
        return { data };
      });

      const [updatedSitio] = response.data.data ?? [];
      if (!updatedSitio) {
        throw new Error("El servidor no devolvió la tienda actualizada");
      }

      const persistedStore = {
        ...store,
        ...updatedSitio,
        monedas: updatedSitio.monedas ?? store.monedas,
        horarios: updatedSitio.horarios ?? store.horarios,
      };
      const relatedCountry = Array.isArray(updatedSitio.regions?.countries)
        ? updatedSitio.regions.countries[0]
        : updatedSitio.regions?.countries;
      persistedStore.country =
        relatedCountry?.code ?? updatedSitio.regions?.country_code ?? "";
      persistedStore.country_name = relatedCountry?.name ?? "";
      delete persistedStore.urlPosterNew;
      delete persistedStore.bannerNew;
      setStore?.(persistedStore);
      setWebshop((prev) => ({ ...prev, store: persistedStore }));
      originalStore.current = snapshotStore(persistedStore);
      if (form.current?.reset) form.current.reset();
      toast.success("Configuración actualizada", {
        description:
          response.data.message ?? "Configuración guardada correctamente",
      });
      router.refresh();
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "No se pudo actualizar la configuración";
      console.error("handleSubmit error:", err);
      toast.error("Error al guardar la configuración", {
        description: msg,
      });
    } finally {
      submitLock.current = false;
      setDownloading(false);
    }
  }

  return (
    <form
      ref={form}
      className="grid gap-6 min-h-screen"
      onSubmit={handleSubmit}
    >
      <fieldset
        disabled={downloading}
        aria-busy={downloading}
        className={`m-0 min-w-0 border-0 p-0 ${
          downloading ? "pointer-events-none select-none" : ""
        }`}
      >
        {children}
      </fieldset>
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
