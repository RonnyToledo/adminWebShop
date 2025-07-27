"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import axios from "axios";
import ImageUpload from "../component/ImageDND";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { logoApp } from "@/utils/image";

export default function NewProduct({ ThemeContext }) {
  const [openCategory, setOpenCategory] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const { webshop, setWebshop } = useContext(ThemeContext);
  const { toast } = useToast();
  const form = useRef(null);
  const [imageNew, setImageNew] = useState();
  const [products, setProducts] = useState({
    favorito: false,
    span: false,
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
    formData.append("priceCompra", products.priceCompra);
    formData.append("caja", products.caja);
    formData.append("favorito", products.favorito);
    formData.append("descripcion", products.descripcion);
    formData.append("span", products.span);
    formData.append("UID", webshop.store.UUID);
    formData.append("creado", getLocalISOString(now));
    if (products.image) formData.append("image", products.image);
    try {
      const res = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/products`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true, // ← incluye cookies
        }
      );
      console.log(res);
      if (res.status === 200 || res.status === 201) {
        toast({
          title: "Tarea Ejecutada",
          description: "Producto creado",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        setWebshop({
          ...webshop,
          products: [...webshop.products, res.data],
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
        setImageNew(null);
      }
    } catch (error) {
      console.error("Crear el producto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el producto.",
      });
    } finally {
      setDownloading(false);
    }
  };
  console.log(products);

  useEffect(() => {
    setProducts((prev) => ({ ...prev, image: imageNew }));
  }, [imageNew]);
  return (
    <main className=" mx-auto py-8 px-4 sm:px-6 lg:px-8 ">
      <form ref={form} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
          <div className="relative border rounded-2x p-5 col-span-1 md:col-span-2 h-64">
            {!imageNew ? (
              <>
                <Label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="images"
                >
                  Imágenes
                </Label>
                <ImageUpload setImageNew={setImageNew} imageNew={imageNew} />
              </>
            ) : (
              <>
                <Image
                  alt="Logo"
                  className="rounded-xl  mx-auto my-1"
                  height={200}
                  width={150}
                  src={
                    imageNew
                      ? URL.createObjectURL(imageNew)
                      : webshop.store.urlPoster || logoApp
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
                    onClick={() => setImageNew(null)}
                  >
                    <Trash2 />{" "}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="border rounded-2x p-5 col-span-1 md:col-span-2">
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
          <div className="border rounded-2x p-5 col-span-1 md:col-span-2">
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
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="price"
            >
              Precio de compra
            </Label>
            <div className="mt-1">
              <Input
                id="price"
                name="price"
                required
                value={products.priceCompra}
                type="number"
                onChange={(e) =>
                  setProducts({
                    ...products,
                    priceCompra: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="border rounded-2x p-5 col-span-1 md:col-span-2 ">
            <Label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="category"
            >
              Categoría
            </Label>
            <div className="mt-1">
              <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategory}
                    className="w-full justify-between bg-transparent"
                  >
                    {products.caja
                      ? webshop.store.categoria.find(
                          (category) => category.id === products.caja
                        )?.name
                      : "Selecciona una categoría..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar categoría..." />
                    <CommandList>
                      <CommandEmpty>
                        No se encontró ningúna categoría.
                      </CommandEmpty>
                      <CommandGroup>
                        {webshop.store.categoria.map((category, ind) => (
                          <CommandItem
                            key={ind}
                            value={category.name}
                            onSelect={() => {
                              setProducts({
                                ...products,
                                caja:
                                  category.id === products.caja
                                    ? ""
                                    : category.id,
                              });

                              setOpenCategory(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                products.caja === category.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="border rounded-2x p-5 col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="ml-3 text-sm flex flex-col space-y-2">
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
                <Label
                  className="font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="special"
                >
                  Producto especial
                </Label>
              </div>

              <div className="ml-3 text-sm flex flex-col space-y-2">
                <Switch
                  id="span"
                  checked={products.span}
                  onCheckedChange={(value) => {
                    setProducts({
                      ...products,
                      span: value,
                    });
                  }}
                />
                <Label
                  className="font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="special"
                >
                  Doble Espacio
                </Label>
              </div>
            </div>
          </div>
          <div className="border rounded-2x p-5 col-span-1 md:col-span-4">
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
