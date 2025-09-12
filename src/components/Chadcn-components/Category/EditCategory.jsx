"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ImageUploadDrag from "@/components/component/ImageDND";
import Image from "next/image";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { logoApp } from "@/utils/image";

export default function EditCategory({ ThemeContext, uid }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [category, setcategory] = useState({
    name: "",
    image: "",
    newImage: "",
    description: "",
    subtienda: false,
    active: true,
    id: 9999,
  });
  const form = useRef(null);
  const [newImage, setNewImage] = useState();
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setcategory((webshop?.store?.categoria || []).find((obj) => obj.id == uid));
  }, [uid, webshop?.store?.categoria]);

  async function handleSubmit(e) {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    Object.keys(category).forEach((key) => {
      const value = category[key];
      if (value instanceof File || value instanceof Blob) {
        // Si es un archivo, lo añadimos directamente sin convertirlo a string
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        // Si es un objeto, lo convertimos a JSON
        formData.append(key, JSON.stringify(value));
      } else {
        // Si es otro tipo de dato, lo convertimos a string
        formData.append(key, String(value));
      }
    });
    try {
      const res = await axios.put(
        `/api/tienda/${webshop?.store?.sitioweb}/categoria/${category?.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Informacion Actualizada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        setWebshop({
          ...webshop,
          store: {
            ...webshop?.store,
            categoria: webshop?.store?.categoria.map((obj) =>
              obj.id == category?.id ? res.data : obj
            ),
          },
        });
        form.current.reset();
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuracion.",
      });
    } finally {
      setDownloading(false);
    }
  }
  useEffect(() => {
    setcategory((prev) => ({ ...prev, newImage: newImage }));
  }, [newImage]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Categoría</h1>
      <form
        className="gap-4 grid md:grid-cols-2"
        onSubmit={handleSubmit}
        ref={form}
      >
        <div className="border rounded-2x p-5">
          <ImageUploadDrag setImageNew={setNewImage} imageNew={newImage} />{" "}
        </div>
        <div className="border rounded-2x p-5">
          <div className="flex justify-center items-center">
            <Image
              src={
                category?.newImage
                  ? URL.createObjectURL(category?.newImage)
                  : category?.image
                  ? category?.image
                  : logoApp
              }
              alt={category?.name || `Category`}
              width={100}
              style={{
                aspectRatio: "200/300",
                objectFit: "cover",
              }}
              height={150}
              className="object-contain"
            />
          </div>
        </div>
        <div className="border rounded-2x p-5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            value={category?.name}
            onChange={(e) => setcategory({ ...category, name: e.target.value })}
            required
          />

          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={category?.description}
            onChange={(e) =>
              setcategory({ ...category, description: e.target.value })
            }
          />
        </div>
        <div className="border rounded-2x p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="isSubstore"
              checked={category?.subtienda}
              onCheckedChange={(value) =>
                setcategory({ ...category, subtienda: value })
              }
            />
            <Label htmlFor="isSubstore">Es una subtienda</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={category?.active}
              onCheckedChange={(value) =>
                setcategory({ ...category, active: value })
              }
            />
            <Label htmlFor="isActive">Está activa</Label>
          </div>
        </div>
        <div className="bg-white p-2 flex justify-center sticky bottom-0 w-full">
          <Button
            className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading}
            type="submit"
          >
            {downloading ? "Guardando..." : "Guardar"}
          </Button>
        </div>{" "}
      </form>
    </div>
  );
}
