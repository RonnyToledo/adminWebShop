"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  EyeOff,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import ImageUploadDrag from "@/components/component/ImageDND";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PostBasicInfo({
  initialData,
  availablePosts = [],
  onComplete,
}) {
  const [formData, setFormData] = useState({
    title: initialData.title,
    slug: initialData.slug,
    excerpt: initialData.excerpt,
    imageUrl: initialData.imageUrl,
    author: initialData.author,
    published: initialData.published,
    publishAt: initialData.publishAt,
    former: initialData.former ?? "",
    next: initialData.next ?? "",
  });
  const [newImage, setNewImage] = useState(() =>
    typeof File !== "undefined" && initialData.imageUrl instanceof File
      ? initialData.imageUrl
      : null,
  );
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(
    Boolean(initialData.removeImage),
  );
  const [focused, setFocused] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (!newImage) {
      setNewImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(newImage);
    setNewImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [newImage]);

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
      toast.error("Error", {
        description: "El título es obligatorio",
      });
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Error", {
        description: "El slug es obligatorio",
      });
      return;
    }
    onComplete({
      ...formData,
      imageUrl: newImage,
      removeImage: removeCurrentImage,
    });
  };

  const baseInput =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200";
  const focusClass = (id) =>
    focused === id
      ? "border-primary ring-2 ring-primary/10"
      : "border-border hover:border-border/60";

  const publishAtLocal = (() => {
    if (!formData.publishAt) return "";
    const date = new Date(formData.publishAt);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  })();
  const imagePreviewSrc =
    newImagePreviewUrl ||
    (typeof formData.imageUrl === "string" ? formData.imageUrl : null);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header con indicador de pasos */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            {initialData.id ? "Editar post" : "Nuevo post"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: "former", label: "Post anterior" },
            { name: "next", label: "Post siguiente" },
          ].map(({ name, label }) => (
            <div className="space-y-1.5" key={name}>
              <label
                htmlFor={`post-${name}`}
                className="block text-[11px] uppercase tracking-[0.12em] font-medium text-muted-foreground"
              >
                {label}
              </label>
              <select
                id={`post-${name}`}
                value={formData[name] ?? ""}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    [name]: event.target.value,
                  }))
                }
                className={`${baseInput} ${focusClass(name)}`}
              >
                <option value="">Sin vincular</option>
                {formData[name] &&
                  !availablePosts.some(
                    (post) => post.slug === formData[name],
                  ) && (
                    <option value={formData[name]} disabled>
                      Referencia no disponible ({formData[name]})
                    </option>
                  )}
                {availablePosts
                  .filter(
                    (post) =>
                      post.slug !== initialData.slug &&
                      (name !== "former" ||
                        post.slug !== formData.next) &&
                      (name !== "next" ||
                        post.slug !== formData.former),
                  )
                  .map((post) => (
                    <option key={post.id} value={post.slug}>
                      {post.title}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Se guarda el slug del post para enlazar la lectura consecutiva.
              </p>
            </div>
          ))}
        </div>

        {/* Imagen */}
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium flex items-center gap-1.5">
            <ImageIcon size={11} /> Imagen de portada
          </p>
          {imagePreviewSrc && !removeCurrentImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
              <Image
                alt="Portada"
                fill
                src={imagePreviewSrc}
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (newImage) {
                    setNewImage(null);
                  } else {
                    setRemoveCurrentImage(true);
                  }
                }}
                aria-label="Quitar portada"
                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-destructive/90 flex items-center justify-center text-white hover:bg-destructive transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <div>
              <ImageUploadDrag
                setImageNew={(image) => {
                  setNewImage(image);
                  setRemoveCurrentImage(false);
                }}
                imageNew={newImage}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Esta será la primera imagen que verán los clientes
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">
            {formData.published ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>
          <div className="flex-1">
            <label
              htmlFor="post-published"
              className="text-sm font-medium text-foreground"
            >
              Publicar post
            </label>
            <p className="text-[11px] text-muted-foreground">
              Actívalo para que pueda aparecer públicamente.
            </p>
          </div>
          <input
            id="post-published"
            type="checkbox"
            checked={formData.published}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                published: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-primary"
          />
        </div>
      </div>

      {/* Continuar */}
      <div className="pt-4 border-t border-border flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setScheduleOpen(true)}
          className="inline-flex items-center gap-2 text-sm px-4 py-3 rounded-xl border border-border text-foreground hover:bg-accent transition-colors font-medium"
        >
          <CalendarClock size={14} />
          {formData.publishAt ? "Cambiar programación" : "Programar"}
        </button>
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
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base">
              Programar publicación
            </DialogTitle>
            <DialogDescription className="text-xs">
              El post se publicará automáticamente en la fecha elegida.
            </DialogDescription>
          </DialogHeader>
          <label
            htmlFor="post-publish-at"
            className="mt-2 block text-xs font-medium text-foreground"
          >
            Fecha y hora
          </label>
          <input
            id="post-publish-at"
            type="datetime-local"
            value={publishAtLocal}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                publishAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              }))
            }
            className={`${baseInput} mt-2`}
          />
          <DialogFooter className="mt-2 -mx-5 -mb-5 flex-row justify-end rounded-b-2xl border-0 bg-transparent p-0">
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              className="h-9 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              disabled={
                !formData.publishAt ||
                new Date(formData.publishAt) <= new Date()
              }
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Confirmar fecha
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
