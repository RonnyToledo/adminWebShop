"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import axios from "axios";
import { GitMerge } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useState, useRef, useContext, useEffect } from "react";
import ImageUpload from "../component/ImageDND";
import ConfimationOut from "../globalFunction/confimationOut";
import { Trash2 } from "lucide-react";

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
  useEffect(() => {
    setProducts(webshop.products.find((obj) => obj.productId == specific));
  }, [webshop, specific]);

  const SaveData = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();

    formData.append("title", products.title);
    formData.append("descripcion", products.descripcion);
    formData.append("price", products.price);
    formData.append("order", products.order);
    formData.append("caja", products.caja);
    formData.append("favorito", products.favorito);
    formData.append("agotado", products.agotado);
    formData.append("visible", products.visible);
    formData.append("Id", products.productId);
    formData.append("oldPrice", products.oldPrice);
    formData.append("span", products.span);
    if (newImage) {
      formData.append("newImage", newImage);
      if (products.image) formData.append("image", products.image);
    }
    console.log(formData);
    try {
      const res = await axios.put(
        `/api/tienda/${webshop.store.sitioweb}/products/${products.productId}/`,
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
        console.log(res.data);
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
          `/api/tienda/${webshop.store.sitioweb}/products/${products.productId}/agregado`,
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
        `/api/tienda/${webshop.store.sitioweb}/products/${products.productId}/agregado`,
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
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Imagen del producto</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center h-64">
                  {newImage ? (
                    <div className="relative">
                      <Image
                        src={URL.createObjectURL(newImage)}
                        alt={products?.title || "Product"}
                        width={100}
                        height={150}
                        style={{ aspectRatio: "200/300", objectFit: "cover" }}
                        className="object-contain"
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
                        src={products.image}
                        alt={products?.title || "Product"}
                        width={100}
                        height={150}
                        style={{ aspectRatio: "200/300", objectFit: "cover" }}
                        className="object-contain"
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

              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Detalles del producto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        type="text"
                        value={products?.title || "..."}
                        onChange={(e) =>
                          setProducts({ ...products, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        defaultValue={products?.descripcion || "..."}
                        onChange={(e) =>
                          setProducts({
                            ...products,
                            descripcion: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Precio</Label>
                      <Input
                        id="price"
                        type="number"
                        defaultValue={products?.price}
                        onChange={(e) =>
                          setProducts({
                            ...products,
                            oldPrice:
                              Number(e.target.value) < products.price
                                ? products.price
                                : Number(e.target.value),
                            price: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      id="category"
                      onValueChange={(value) => {
                        setProducts({
                          ...products,
                          caja: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            webshop.store.categoria.find(
                              (obj) => obj.id == products?.caja
                            )?.name
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {webshop.store.categoria.map((obj, ind) => (
                          <SelectItem key={ind} value={obj.id}>
                            {obj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col justify-center p-3 items-center gap-2 ">
                      <Label htmlFor="out-of-stock ">Producto Agotado</Label>
                      <Switch
                        id="out-of-stock"
                        checked={products?.agotado}
                        onCheckedChange={(value) =>
                          setProducts({ ...products, agotado: value })
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-center p-3 items-center gap-2 ">
                      <Label htmlFor="favorite">Producto Destacado</Label>
                      <Switch
                        id="favorite"
                        checked={products?.favorito}
                        onCheckedChange={(value) =>
                          setProducts({ ...products, favorito: value })
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-center p-3 items-center gap-2 ">
                      <Label htmlFor="visible">Producto Visible</Label>
                      <Switch
                        id="visible"
                        checked={products?.visible}
                        onCheckedChange={(value) =>
                          setProducts({ ...products, visible: value })
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-center p-3 items-center gap-2 ">
                      <Label htmlFor="visible">Doble Espacio</Label>
                      <Switch
                        id="visible"
                        checked={products?.span}
                        onCheckedChange={(value) =>
                          setProducts({ ...products, span: value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Agregado</CardTitle>
                </CardHeader>
                <CardContent>
                  {products?.agregados.length > 0 &&
                    products?.agregados.map((obj1, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between "
                      >
                        <div className="flex items-center gap-2">
                          <GitMerge className="h-5 w-5 text-primary" />
                          <p className="text-base font-medium">{obj1.nombre}</p>
                          <p className="text-base font-medium">${obj1.valor}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => Delete(e, obj1.id)}
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    ))}
                  <div className="flex items-center justify-between">
                    <form
                      ref={form}
                      className="space-x-6 flex items-center justify-between"
                    >
                      <div>
                        <Label
                          htmlFor="new-subcategory"
                          className="text-base font-medium"
                        >
                          Nombre
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          required
                          value={newAregados.nombre}
                          type="text"
                          onChange={(e) =>
                            setNewAgregados({
                              ...newAregados,
                              nombre: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="new-subcategory"
                          className="text-base font-medium"
                        >
                          Valor
                        </Label>
                        <Input
                          id="value"
                          name="value"
                          required
                          value={newAregados.valor}
                          type="number"
                          onChange={(e) =>
                            setNewAgregados({
                              ...newAregados,
                              valor: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        variant="outline m-2"
                        className="w-16"
                        onClick={SubirAgregado}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </form>
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
// Utilidad y helpers
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
