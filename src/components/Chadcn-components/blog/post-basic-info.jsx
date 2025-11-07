"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUploadDrag from "@/components/component/ImageDND";
import Image from "next/image";

export function PostBasicInfo({ initialData, onComplete }) {
  const [formData, setFormData] = useState({
    title: initialData.title,
    slug: initialData.slug,
    excerpt: initialData.excerpt,
    imageUrl: initialData.imageUrl,
    author: initialData.author,
    published: initialData.published,
  });
  const [newImage, setNewImage] = useState(false);

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
      toast.error("El título es obligatorio");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("El slug es obligatorio");
      return;
    }

    onComplete({ ...formData, imageUrl: newImage });
  };

  return (
    <Card className="m-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Paso 1: Información Básica</CardTitle>
            <CardDescription>
              Completa los detalles principales de tu artículo
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div className="w-6 border-t-2 border-muted" />
            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">
              2
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Título */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">
              Título del Post <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Introducción a Next.js 16"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="slug">
              Slug (URL) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /blog/
              </span>
              <Input
                id="slug"
                placeholder="introduccion-nextjs-16"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>

          {/* Extracto */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="excerpt">Extracto</Label>
            <Textarea
              id="excerpt"
              placeholder="Breve descripción del artículo..."
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* URL de Imagen */}
          <div className="md:col-span-2">
            {newImage ? (
              <div className="relative">
                <Image
                  alt="Logo"
                  className="rounded-xl  mx-auto my-1 aspect-square"
                  height={300}
                  width={300}
                  src={
                    newImage
                      ? URL.createObjectURL(newImage)
                      : webshop?.store?.urlPoster || logoApp
                  }
                  style={{
                    objectFit: "cover",
                  }}
                />

                <div className="absolute top-1 right-1 z-[1]">
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-full p-2 h-8 w-8"
                    size="icon"
                    onClick={() => setNewImage(null)} // Borra la nueva imagen
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full">
                <ImageUploadDrag
                  setImageNew={setNewImage} // Permite subir nueva imagen
                  imageNew={newImage}
                />
                <p className="text-xs text-muted-foreground">
                  Esta será la primera imagen que verán los clientes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botón continuar */}
        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button onClick={handleContinue} size="lg" className="gap-2 ">
            Continuar al Editor
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
