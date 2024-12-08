"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import axios from "axios";
import ImageUpload from "../component/ImageDND";

export default function NewProduct({ ThemeContext }) {
  const [downloading, setDownloading] = useState(false);
  const { webshop, setWebshop } = useContext(ThemeContext);
  const { toast } = useToast();
  const form = useRef(null);
  const [imageNew, setImageNew] = useState();
  const [products, setProducts] = useState({
    favorito: false,
    title: "",
    descripcion: "",
    discount: 0,
  });

  function getLocalISOString(date) {
    const offset = date.getTimezoneOffset(); // Obtiene el desfase en minutos
    const localDate = new Date(date.getTime() - offset * 60000); // Ajusta la fecha a UTC
    return localDate.toISOString().slice(0, 19); // Formato "YYYY-MM-DDTHH:mm:ss"
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    setDownloading(true);
    const formData = new FormData();
    formData.append("title", products.title);
    formData.append("price", products.price);
    formData.append("caja", products.caja);
    formData.append("favorito", products.favorito);
    formData.append("descripcion", products.descripcion);
    formData.append("UID", webshop.store.UUID);
    formData.append("creado", getLocalISOString(now));
    if (products.image) formData.append("image", products.image);
    try {
      const res = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/products`,
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
          description: "Producto creado",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        const [a] = res.data;
        setWebshop({
          ...webshop,
          products: [...webshop.products, a],
        });
        form.current.reset();
        setProducts({
          ...products,
          favorito: false,
          title: "",
          descripcion: "",
          discount: 0,
          price: 0,
        });
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el producto.",
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    setProducts({ ...products, image: imageNew });
  }, [imageNew]);

  return (
    <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 ">
      <form ref={form} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="images"
          >
            Imágenes
          </Label>
          <ImageUpload setImageNew={setImageNew} imageNew={imageNew} />
          {imageNew && (
            <Image
              alt="Logo"
              className="rounded-xl  mx-auto my-1"
              height={200}
              width={150}
              src={URL.createObjectURL(imageNew)}
              style={{
                aspectRatio: "40/40",
                objectFit: "cover",
              }}
            />
          )}
        </div>
        <div>
          <Label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="title"
          >
            Título
          </Label>
          <div className="mt-1">
            <Input
              id="title"
              name="title"
              required
              value={products.title}
              type="text"
              onChange={(e) =>
                setProducts({
                  ...products,
                  title: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div>
          <Label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="price"
          >
            Precio
          </Label>
          <div className="mt-1">
            <Input
              id="price"
              name="price"
              required
              value={products.price}
              type="number"
              onChange={(e) =>
                setProducts({
                  ...products,
                  price: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div>
          <Label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="category"
          >
            Categoría
          </Label>
          <div className="mt-1">
            <Select
              id="category"
              name="category"
              required
              onValueChange={(value) =>
                setProducts({
                  ...products,
                  caja: value,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {webshop.store.categoria.map((obj, ind) => (
                    <SelectItem key={ind} value={obj.name}>
                      {obj.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <Switch
              id="reservation"
              checked={products.favorito}
              onCheckedChange={(value) => {
                setProducts({
                  ...products,
                  favorito: value,
                });
              }}
            />
          </div>
          <div className="ml-3 text-sm">
            <Label
              className="font-medium text-gray-700 dark:text-gray-300"
              htmlFor="special"
            >
              Producto especial
            </Label>
          </div>
        </div>
        <div>
          <Label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="description"
          >
            Descripción
          </Label>
          <div className="mt-1">
            <Textarea
              id="description"
              name="description"
              value={products.descripcion}
              rows={3}
              onChange={(e) =>
                setProducts({
                  ...products,
                  descripcion: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
          <Button
            type="submit"
            className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading}
          >
            {downloading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </main>
  );
}
function ArrowLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function CloudUploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}
function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
