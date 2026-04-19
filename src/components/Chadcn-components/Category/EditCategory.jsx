"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ImageUploadDrag from "@/components/component/ImageDND";
import Image from "next/image";
import { sileo } from "sileo";
import apiClient from "@/lib/apiClient";
import { logoApp } from "@/utils/image";
import { Loader2, ImageIcon, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditCategory({ ThemeContext, uid }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [category, setCategory] = useState({
    name: "",
    image: "",
    newImage: "",
    description: "",
    subtienda: false,
    active: true,
    id: 9999,
  });
  const form = useRef(null);
  const [newImage, setNewImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    setCategory((webshop?.store?.categoria || []).find((obj) => obj.id == uid));
  }, [uid, webshop?.store?.categoria]);

  useEffect(() => {
    setCategory((prev) => ({ ...prev, newImage }));
  }, [newImage]);

  async function handleSubmit(e) {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    Object.keys(category).forEach((key) => {
      const value = category[key];
      if (value instanceof File || value instanceof Blob)
        formData.append(key, value);
      else if (typeof value === "object" && value !== null)
        formData.append(key, JSON.stringify(value));
      else formData.append(key, String(value));
    });
    try {
      const res = await apiClient.put(
        `/api/tienda/${webshop?.store?.sitioweb}/categoria/${category?.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.status === 200) {
        sileo.success({
          title: "Categoría actualizada",
          description: "La categoría fue actualizada correctamente.",
        });
        setWebshop({
          ...webshop,
          store: {
            ...webshop?.store,
            categoria: webshop?.store?.categoria.map((obj) =>
              obj.id === category?.id ? res.data : obj,
            ),
          },
        });
        form.current?.reset();
      }
    } catch (error) {
      console.error(error);
      sileo.error({
        title: "Error al actualizar",
        description: "No se pudo actualizar la categoría.",
      });
    } finally {
      setDownloading(false);
    }
  }

  const baseInput =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200";
  const focusClass = (id) =>
    focused === id
      ? "border-primary ring-2 ring-primary/10"
      : "border-border hover:border-border/60";

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
          Catálogo
        </p>
        <h1 className="text-2xl font-normal text-foreground italic">
          Editar categoría
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {category?.name || "Cargando..."}
        </p>
      </div>

      <form onSubmit={handleSubmit} ref={form} className="space-y-5">
        {/* Imagen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Upload */}
          <div className="bg-secondary/30 border border-border rounded-xl p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium mb-3 flex items-center gap-1.5">
              <ImageIcon size={11} /> Subir nueva imagen
            </p>
            <ImageUploadDrag setImageNew={setNewImage} imageNew={newImage} />
          </div>

          {/* Preview */}
          <div className="bg-secondary/30 border border-border rounded-xl p-4 flex items-center justify-center">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border">
              <Image
                src={
                  newImage
                    ? URL.createObjectURL(newImage)
                    : category?.image || logoApp
                }
                alt={category?.name || "Categoría"}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${focused === "name" ? "text-primary" : "text-muted-foreground"}`}
          >
            Nombre *
          </label>
          <input
            id="name"
            value={category?.name || ""}
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            placeholder="Nombre de la categoría"
            required
            className={`${baseInput} ${focusClass("name")}`}
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${focused === "desc" ? "text-primary" : "text-muted-foreground"}`}
          >
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            defaultValue={category?.description || ""}
            onChange={(e) =>
              setCategory({ ...category, description: e.target.value })
            }
            onFocus={() => setFocused("desc")}
            onBlur={() => setFocused(null)}
            placeholder="Describe brevemente esta categoría..."
            className={`${baseInput} ${focusClass("desc")} resize-none`}
          />
        </div>

        {/* Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">Subtienda</p>
              <p className="text-xs text-muted-foreground">
                Mostrar como tienda separada
              </p>
            </div>
            <Switch
              checked={!!category?.subtienda}
              onCheckedChange={(v) =>
                setCategory({ ...category, subtienda: v })
              }
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">Activa</p>
              <p className="text-xs text-muted-foreground">
                Visible en el catálogo
              </p>
            </div>
            <Switch
              checked={!!category?.active}
              onCheckedChange={(v) => setCategory({ ...category, active: v })}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={downloading}
            whileHover={{ scale: downloading ? 1 : 1.02 }}
            whileTap={{ scale: downloading ? 1 : 0.98 }}
            className={`w-full flex items-center justify-center gap-2 text-sm py-3.5 rounded-xl font-medium transition-all ${
              downloading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                Guardar cambios <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
