"use client";
import React, { useState } from "react";
import { ArrowRight, Trash2, ImageIcon } from "lucide-react";
import { sileo } from "sileo";
import ImageUploadDrag from "@/components/component/ImageDND";
import Image from "next/image";
import { motion } from "framer-motion";

export function PostBasicInfo({ initialData, onComplete }) {
  const [formData, setFormData] = useState({
    title: initialData.title,
    slug: initialData.slug,
    excerpt: initialData.excerpt,
    imageUrl: initialData.imageUrl,
    author: initialData.author,
    published: initialData.published,
  });
  const [newImage, setNewImage] = useState(null);
  const [focused, setFocused] = useState(null);

  const handleTitleChange = (title) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleContinue = () => {
    if (!formData.title.trim()) {
      sileo.error({ title: "Error", description: "El título es obligatorio" });
      return;
    }
    if (!formData.slug.trim()) {
      sileo.error({ title: "Error", description: "El slug es obligatorio" });
      return;
    }
    onComplete({ ...formData, imageUrl: newImage });
  };

  const baseInput =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200";
  const focusClass = (id) =>
    focused === id
      ? "border-primary ring-2 ring-primary/10"
      : "border-border hover:border-border/60";

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header con indicador de pasos */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Nuevo post
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Información básica
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Completa los datos principales del artículo
          </p>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
            1
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="w-7 h-7 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center text-xs font-medium">
            2
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Título */}
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${focused === "title" ? "text-primary" : "text-muted-foreground"}`}
          >
            Título del post *
          </label>
          <input
            id="title"
            placeholder="Ej: Introducción a Next.js 16"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={() => setFocused("title")}
            onBlur={() => setFocused(null)}
            className={`${baseInput} ${focusClass("title")}`}
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label
            htmlFor="slug"
            className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${focused === "slug" ? "text-primary" : "text-muted-foreground"}`}
          >
            Slug (URL) *
          </label>
          <div className="flex items-center gap-0">
            <span className="shrink-0 text-xs text-muted-foreground bg-secondary border border-border border-r-0 rounded-l-xl px-3 py-3 h-[46px] flex items-center">
              /blog/
            </span>
            <input
              id="slug"
              placeholder="introduccion-nextjs-16"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              onFocus={() => setFocused("slug")}
              onBlur={() => setFocused(null)}
              className={`${baseInput} ${focusClass("slug")} rounded-l-none flex-1`}
            />
          </div>
        </div>

        {/* Extracto */}
        <div className="space-y-1.5">
          <label
            htmlFor="excerpt"
            className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${focused === "excerpt" ? "text-primary" : "text-muted-foreground"}`}
          >
            Extracto
          </label>
          <textarea
            id="excerpt"
            rows={3}
            placeholder="Breve descripción del artículo..."
            value={formData.excerpt}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
            }
            onFocus={() => setFocused("excerpt")}
            onBlur={() => setFocused(null)}
            className={`${baseInput} ${focusClass("excerpt")} resize-none`}
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium flex items-center gap-1.5">
            <ImageIcon size={11} /> Imagen de portada
          </p>
          {newImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
              <Image
                alt="Portada"
                fill
                src={URL.createObjectURL(newImage)}
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setNewImage(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-destructive/90 flex items-center justify-center text-white hover:bg-destructive transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <div>
              <ImageUploadDrag setImageNew={setNewImage} imageNew={newImage} />
              <p className="text-xs text-muted-foreground mt-1.5">
                Esta será la primera imagen que verán los clientes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Continuar */}
      <div className="pt-4 border-t border-border flex justify-end">
        <motion.button
          type="button"
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 text-sm px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          Continuar al editor
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}
