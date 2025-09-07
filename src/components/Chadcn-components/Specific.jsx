"use client";

import React, { useState, useCallback, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "../component/ImageDND";
import ConfimationOut from "../globalFunction/confimationOut";
import SecondaryImagesManager from "../secondaryImagesManager";
import {
  Trash2,
  Check,
  ChevronsUpDown,
  DollarSign,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Separator } from "../ui/separator";
import { logoApp } from "@/utils/image";
import { extractBlobFilesFromArray } from "../globalFunction/extractBlobFilesFromArray";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "../component/cardGrid";
import ProductDetailPage from "../component/cardSpecific";
import { ScrollArea } from "../ui/scroll-area";
import Caracteristicas from "../component/Caracteristicas";

const defaultProduct = {
  productId: null,
  title: "",
  descripcion: "",
  price: "",
  order: "",
  caja: "",
  favorito: false,
  agotado: false,
  visible: true,
  span: false,
  image: "",
  imagesecondary: [logoApp, logoApp, logoApp],
  caracteristicas: [],
  oldPrice: "",
  priceCompra: 0,
  // añade aquí otras propiedades que uses en los inputs
};

// util para comparar arrays simples de strings
function arraysEqual(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function Specific({ specific, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  // inicializar con defaultProduct para que products NUNCA sea undefined
  const [products, setProducts] = useState(defaultProduct);
  const [newImage, setNewImage] = useState(null);
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      setProducts({
        ...products,
        caracteristicas: Array.from(
          new Set([...(products.caracteristicas || []), newItem.trim()])
        ),
      });
      setNewItem("");
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Introduzca una caracteristica",
      });
    }
  };

  const removeItem = (indexToRemove) => {
    setProducts({
      ...products,
      caracteristicas: products.caracteristicas.filter(
        (c) => c !== indexToRemove
      ),
    });
  };

  // Seguro: buscar producto y merge con defaultProduct para tener siempre las props
  useEffect(() => {
    setProducts(webshop.products.find((prod) => prod.productId === specific));
  }, [webshop?.products, specific]);

  // Evita acceder a propiedades de `undefined` en comparaciones debug:
  // Solo ejecutamos esta comprobación si existe el producto en webshop
  useEffect(() => {
    const found =
      Array.isArray(webshop?.products) &&
      webshop.products.find((obj) => obj.productId == specific);

    if (found) {
      const foundImages = Array.isArray(found?.imagesecondary)
        ? found?.imagesecondary
        : defaultProduct?.imagesecondary;
      const currentClean = (products?.imagesecondary || []).filter(
        (o) => o !== logoApp
      );
    } else {
      // opcional: no hacer nada si no hay producto
    }
  }, [webshop?.products, specific, products?.imagesecondary]);

  // handlers para SecondaryImagesManager
  const handleImagesChangeClean = useCallback((cleanImages) => {
    setProducts((prev) => {
      const prevClean = (prev?.imagesecondary || []).filter(Boolean);
      if (arraysEqual(prevClean, cleanImages)) return prev;
      const fixed = [...cleanImages];
      while (fixed.length < 3) fixed.push(logoApp);
      return { ...prev, imagesecondary: fixed };
    });
  }, []);

  const handleImagesChange = useCallback((newImages) => {
    setProducts((prev) => {
      const prevImgs = Array.isArray(prev?.imagesecondary)
        ? prev?.imagesecondary
        : [];
      if (arraysEqual(prevImgs, newImages)) {
        return prev;
      }
      return { ...prev, imagesecondary: newImages };
    });
  }, []);

  // SaveData: usa products.* que siempre existen (gracias a defaultProduct)
  const SaveData = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();

    const imagesecondary = products?.imagesecondary.filter(
      (obj) => obj !== logoApp
    );
    const imagesecondaryWebshop = webshop.products.find(
      (obj) => obj.productId == specific
    )?.imagesecondary;
    // Aseguramos que no enviamos undefined usando ?? ""
    formData.append("title", products.title ?? "");
    formData.append("descripcion", products.descripcion ?? "");
    formData.append("price", products.price ?? 0);
    formData.append("priceCompra", products.priceCompra ?? 0);
    formData.append("order", products.order ?? 100000);
    formData.append("caja", products.caja ?? "");
    formData.append(
      "caracteristicas",
      JSON.stringify(products?.caracteristicas) ?? ""
    );
    formData.append("favorito", String(!!products.favorito));
    formData.append("agotado", String(!!products.agotado));
    formData.append("visible", String(!!products.visible));
    formData.append("Id", String(products.productId ?? ""));
    formData.append("oldPrice", products.oldPrice ?? 0);
    formData.append("span", String(!!products.span));
    formData.append("image", products.image ?? "");
    formData.append("imagesecondary", JSON.stringify(imagesecondary));
    formData.append(
      "imagesecondaryCopy",
      JSON.stringify(imagesecondaryWebshop)
    );
    if (
      JSON.stringify(imagesecondaryWebshop) !== JSON.stringify(imagesecondary)
    ) {
      const value = await extractBlobFilesFromArray(imagesecondary, {
        filenamePrefix: "prod",
        revokeObjectURL: true,
      });
      // metadata: index + filename + previewUrl (para mapear en server)
      const meta = value.map((v) => ({
        index: v.index,
        filename: v.file.name,
        previewUrl: v.previewUrl ?? null,
      }));

      // agregamos metadata como JSON (pequeño y seguro)
      formData.append("NewImagesSecondaryMeta", JSON.stringify(meta));

      // agregamos cada File real al FormData (no serializar)
      value.forEach((v) => {
        // igual key para todos -> getAll en server
        formData.append("newImageSecondaryFiles", v.file, v.file.name);
      });
    }
    if (newImage) {
      formData.append("newImage", newImage);
      if (products.image) formData.append("image", products.image);
    }

    try {
      const res = await axios.put(
        `/api/tienda/${webshop?.store?.sitioweb}/products/${products?.productId}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Informacion Actualizada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        const [a] = res.data;
        setWebshop({
          ...webshop,
          products: (webshop?.products || []).map((obj) =>
            obj.productId == products.productId ? products : obj
          ),
        });
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se actualizar el producto.",
      });
    } finally {
      setDownloading(false);
    }
  };
  console.log(products?.caracteristicas);
  return (
    <main className="grid min-h-screen w-full ">
      <div className="flex flex-col p-3 w-full ">
        <form onSubmit={SaveData} className="flex flex-1 flex-col gap-8 ">
          <div className="grid gap-6 md:grid-cols-7">
            <div className="grid col-span-1 md:col-span-5 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Imagen del producto</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center h-64">
                  {newImage ? (
                    <div className="relative">
                      <Image
                        alt="Logo"
                        className="rounded-xl  mx-auto my-1"
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
                  ) : !deleteOriginal && products?.image ? (
                    <div className="relative">
                      <Image
                        src={products?.image || logoApp}
                        alt={products?.title || "Product"}
                        width={300}
                        height={300}
                        style={{ aspectRatio: "200/300", objectFit: "cover" }}
                        className="object-contain h-full w-full"
                      />
                      <div className="absolute top-1 right-1 z-[1]">
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-full p-2 h-8 w-8"
                          size="icon"
                          onClick={() => setDeleteOriginal(true)} // Marca la original para borrar
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <Label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="images"
                      >
                        Imágenes
                      </Label>
                      <ImageUpload
                        setImageNew={setNewImage} // Permite subir nueva imagen
                        imageNew={newImage}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle> Imágenes Secundarias</CardTitle>
                  <CardDescription>
                    Arrastra las imágenes para reordenarlas. Máximo 3 imágenes
                    secundarias.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecondaryImagesManager
                    initialImages={products?.imagesecondary || []}
                    onChange={handleImagesChange}
                    onChangeClean={handleImagesChangeClean}
                    maxImages={3}
                  />
                </CardContent>
              </Card>

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
                      value={products?.title}
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
                      value={products?.descripcion}
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
                        value={products?.price}
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
                        value={products?.priceCompra}
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
                          {products?.caja
                            ? webshop?.store?.categoria.find(
                                (category) => category.id === products?.caja
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
                              {webshop?.store?.categoria.map(
                                (category, ind) => (
                                  <CommandItem
                                    key={ind}
                                    value={category.name}
                                    onSelect={() => {
                                      setProducts({
                                        ...products,
                                        caja:
                                          category.id === products?.caja
                                            ? ""
                                            : category.id,
                                      });

                                      setOpenCategory(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        products?.caja === category.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {category.name}
                                  </CommandItem>
                                )
                              )}
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
                      checked={products?.favorito}
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
                      checked={products?.span}
                      onCheckedChange={(value) => {
                        setProducts({
                          ...products,
                          span: value,
                        });
                      }}
                    />
                  </div>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Producto Agotado
                      </Label>
                      <p className="text-xs text-slate-500">
                        Disponible para comprarlo
                      </p>
                    </div>
                    <Switch
                      checked={products?.agotado}
                      onCheckedChange={(value) =>
                        setProducts({ ...products, agotado: value })
                      }
                    />
                  </div>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Producto Visible
                      </Label>
                      <p className="text-xs text-slate-500">
                        Indica si este producto será visible por los usuarios en
                        el catalogo
                      </p>
                    </div>
                    <Switch
                      checked={products?.visible}
                      onCheckedChange={(value) =>
                        setProducts({
                          ...products,
                          visible: value,
                          modified: new Date().toISOString(),
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Caracteristicas
                items={products?.caracteristicas || []}
                addItem={addItem}
                removeItem={removeItem}
                newItem={newItem}
                setNewItem={setNewItem}
              />
            </div>
            {/* Vista Previa */}
            <div className="sticky top-20  max-h-[70svh]  grid grid-cols-1 md:col-span-2">
              <Card>
                <CardContent className="p-2">
                  <Tabs defaultValue="grid">
                    <TabsList>
                      <TabsTrigger value="grid">Grid</TabsTrigger>
                      <TabsTrigger value="specific">Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="grid" className="p-0">
                      <ProductCard
                        product={products}
                        store={webshop?.store}
                        banner={logoApp}
                      />
                    </TabsContent>
                    <TabsContent value="specific" className="p-0">
                      <ScrollArea className="h-[70vh]">
                        <ProductDetailPage
                          product={products}
                          store={webshop?.store}
                          logoApp={logoApp}
                          id="123"
                        />
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
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
          </div>
        </form>
      </div>
      <ConfimationOut
        action={hasPendingChanges(
          webshop?.products?.find((obj) => obj.productId == specific),
          products
        )}
      />
    </main>
  );
}

// Utilidad y helpers
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
