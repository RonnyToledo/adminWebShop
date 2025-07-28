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
import { Eye, DollarSign, FileText, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <main className=" mx-auto  px-4 sm:px-6 lg:px-8 ">
      <form ref={form} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className=" col-span-1 md:col-span-2 grid grid-cols-1 gap-2">
            {/* Columna Principal */}
            <div className="col-span-1  space-y-6">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Título del Producto *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ej: iPhone 15 Pro Max 256GB"
                      value={products.title}
                      onChange={(e) =>
                        setProducts({
                          ...products,
                          title: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe las características principales del producto..."
                      value={products.descripcion}
                      onChange={(e) =>
                        setProducts({
                          ...products,
                          descripcion: e.target.value,
                        })
                      }
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Imágenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Imágen del Producto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!imageNew ? (
                    <>
                      <ImageUpload
                        setImageNew={setImageNew}
                        imageNew={imageNew}
                      />
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
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Precio y Categoría */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Precio y Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">
                      Precio de Venta *
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={products.price}
                        onChange={(e) =>
                          setProducts({
                            ...products,
                            price: e.target.value,
                          })
                        }
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">
                      Inversion
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={products.priceCompra}
                        onChange={(e) =>
                          setProducts({
                            ...products,
                            priceCompra: e.target.value,
                          })
                        }
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Categoría *</Label>
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
                </CardContent>
              </Card>

              {/* Configuraciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuraciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Producto Especial
                      </Label>
                      <p className="text-xs text-slate-500">
                        Destacar en la tienda
                      </p>
                    </div>
                    <Switch
                      checked={products.favorito}
                      onCheckedChange={(value) => {
                        setProducts({
                          ...products,
                          favorito: value,
                        });
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Doble Espacio
                      </Label>
                      <p className="text-xs text-slate-500">
                        Ocupa más espacio en grid
                      </p>
                    </div>
                    <Switch
                      checked={products.span}
                      onCheckedChange={(value) => {
                        setProducts({
                          ...products,
                          span: value,
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Vista Previa */}
          <div className="sticky top-20  max-h-[70svh]  grid grid-cols-1">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className=" rounded-lg  bg-white">
                  <div className="flex justify-center">
                    <Image
                      src={
                        imageNew
                          ? URL.createObjectURL(imageNew)
                          : webshop.store.urlPoster || logoApp
                      }
                      alt="Vista previa"
                      className={` object-cover rounded mb-1 ${
                        products.span ? "w-full" : "w-auto"
                      }`}
                      style={
                        products.span
                          ? { aspectRatio: "16/9" }
                          : { aspectRatio: "4/5" }
                      }
                      width={150}
                      height={150}
                    />
                  </div>
                  <h3 className="font-medium text-sm truncate line-clamp-1">
                    {products.title || "Título del producto"}
                  </h3>
                  <div className="grid grid-cols-4 items-center mt-2">
                    <h3 className="col-span-3 font-medium text-xs line-clamp-2">
                      {products.descripcion || "Descripcion"}
                    </h3>
                    <p className="col-span-1 text-end text-xs font-bold text-red-600">
                      ${Number(products.price).toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
