"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import axios from "axios";
import { Eye } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useState, useRef, useContext, useEffect } from "react";
import ImageUpload from "../component/ImageDND";
import ConfimationOut from "../globalFunction/confimationOut";
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

export default function Specific({ specific, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [newAregados, setNewAgregados] = useState({
    nombre: "",
    valor: 0,
    cantidad: 0,
  });
  const { toast } = useToast();
  const form = useRef(null);
  const [products, setProducts] = useState({
    agregados: [],
  });
  const [newImage, setNewImage] = useState();
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

  useEffect(() => {
    setProducts(webshop.products.find((obj) => obj.productId == specific));
  }, [webshop, specific]);
  console.log("Products:", products);

  const SaveData = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();

    formData.append("title", products?.title);
    formData.append("descripcion", products?.descripcion);
    formData.append("price", products?.price);
    formData.append("order", products?.order);
    formData.append("caja", products?.caja);
    formData.append("favorito", products?.favorito);
    formData.append("agotado", products?.agotado);
    formData.append("visible", products?.visible);
    formData.append("Id", products?.productId);
    formData.append("oldPrice", products?.oldPrice);
    formData.append("span", products?.span);
    if (newImage) {
      formData.append("newImage", newImage);
      if (products?.image) formData.append("image", products?.image);
    }
    try {
      const res = await axios.put(
        `/api/tienda/${webshop.store.sitioweb}/products/${products?.productId}/`,
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
        const [a] = res.data;
        const b = webshop.products.map((obj) =>
          obj.productId == a.productId ? a : obj
        );
        setWebshop({ ...webshop, products: b });
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
  const SubirAgregado = async (e) => {
    e.preventDefault();
    try {
      if (newAregados.nombre && newAregados.valor) {
        const formData = new FormData();

        formData.append("nombre", newAregados.nombre);
        formData.append("valor", newAregados.valor);
        formData.append("cantidad", newAregados.cantidad);
        const res = await axios.post(
          `/api/tienda/${webshop.store.sitioweb}/products/${products?.productId}/agregado`,
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
          setProducts({
            ...products,
            agregados: [...products?.agregados, res?.data?.value],
          });
          setNewAgregados({
            nombre: "",
            valor: 0,
            cantidad: 0,
          });
        } else {
          toast({
            title: "Error",
            variant: "destructive",

            description: "No hay datos.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",

        description: "No se actualizar el producto.",
      });
    }
  };
  const Delete = async (e, id) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      formData.append("id", id);
      const res = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/products/${products?.productId}/agregado`,
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
        setProducts({
          ...products,
          agregados: products?.agregados.filter((fil) => fil.id != id),
        });
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        title: "Error",
        variant: "destructive",

        description: "No se actualizar el producto.",
      });
    }
  };

  return (
    <main className="grid min-h-screen w-full ">
      <div className="flex flex-col p-3 w-full ">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Editar producto</h1>
        </div>
        <form onSubmit={SaveData} className="flex flex-1 flex-col gap-8 p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="grid col-span-1 md:col-span-2 gap-6">
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
                          imageNew
                            ? URL.createObjectURL(newImage)
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
                        setProducts({ ...products, visible: value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
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
                <Separator />
                <CardContent className="p-4">
                  <div className=" rounded-lg  bg-white">
                    <div className=" flex justify-center">
                      <Image
                        src={
                          newImage
                            ? URL.createObjectURL(newImage)
                            : products.image ||
                              webshop.store.urlPoster ||
                              logoApp
                        }
                        alt="Vista previa"
                        className={` object-cover rounded mb-1 ${
                          products.span ? "w-full" : "w-auto"
                        }`}
                        style={{
                          aspectRatio: products.span ? "16/9" : "4/5",
                          filter: products.agotado
                            ? "grayscale(100%)"
                            : "grayscale(0)",
                        }}
                        width={300}
                        height={300}
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
          webshop.products.find((obj) => obj.productId == specific),
          products
        )}
      />
    </main>
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
// Utilidad y helpers
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
