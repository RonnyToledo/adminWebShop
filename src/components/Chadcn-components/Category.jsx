"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useRef, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

export default function Category({ ThemeContext }) {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [category, setCategory] = useState([]);
  const { toast } = useToast();
  const form = useRef(null);
  const [formulario, setFormulario] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [products, setproducts] = useState([]);

  useEffect(() => {
    setCategory(webshop.store.categoria);
    setproducts(webshop.products);
  }, [webshop]);

  const catSubmit = (e) => {
    e.preventDefault();
    setCategory(Array.from(new Set([...category, newCat])));
    form.current.reset();
    setNewCat("");
  };
  function startDrag(evt, obj) {
    evt.dataTransfer.setData("itemId", obj);
    const array = webshop.store.categoria.filter((objeto) => objeto !== obj);
    array.push(obj);
    setwebshop({
      ...webshop,
      store: { ...webshop.store, categoria: array },
    });
  }
  function startDrag1(evt, obj) {
    const array = webshop.store.categoria.filter((objeto) => objeto !== obj);
    array.push(obj);
    setwebshop({
      ...webshop,
      store: { ...webshop.store, categoria: array },
    });
  }
  function startDrag1(evt, obj) {
    const array = webshop.store.categoria.filter((objeto) => objeto !== obj);
    array.push(obj);
    setwebshop({
      ...webshop,
      store: { ...webshop.store, categoria: array },
    });
  }
  const Eliminar = (obj) => {
    const array = webshop.store.categoria.filter((objeto) => objeto !== obj);
    setwebshop({
      ...webshop,
      store: { ...webshop.store, categoria: array },
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Crear un objeto desde el array fijo para facilitar la comparación
    const fijoDict = Object.fromEntries(
      webshop.products.map((obj) => [obj.id, obj])
    );

    // Identificar objetos con campo 'caja' diferente
    const diferentes = products.filter((obj) => {
      const objetoFijo = fijoDict[obj.id];
      return objetoFijo && objetoFijo.caja !== obj.caja;
    });
    console.log(diferentes);
    setDownloading(true);
    const formData = new FormData();
    formData.append("categoria", JSON.stringify(category));
    formData.append("products", JSON.stringify(diferentes));
    try {
      const res = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/categoria`,
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
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorias.",
      });
    } finally {
      setDownloading(false);
      setwebshop({
        ...webshop,
        store: {
          ...webshop.store,
          categoria: category,
        },
        products: products,
      });
    }
  };
  function Reset() {
    setFormulario(false);
    form.current.reset();
    setNewCat("");
  }
  console.log(products);

  return (
    <main className="py-8 px-6">
      <div className="mb-6">
        <Button
          size="sm"
          onClick={() => {
            formulario ? Reset() : setFormulario(true);
          }}
        >
          {formulario ? "Cerrar" : "Agregar Categoría"}
        </Button>
      </div>
      {formulario && (
        <div className="mt-8 mb-5 ">
          <h2 className="text-lg font-bold mb-4">Agregar Categoría</h2>
          <form
            className="bg-white border rounded-lg p-6 space-y-4"
            onSubmit={catSubmit}
            ref={form}
          >
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ingresa el nombre de la categoría"
                type="text"
                onChange={(e) => setNewCat(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button>Guardar</Button>
            </div>
          </form>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {category.map((obj, ind) => (
            <div
              key={ind}
              className="bg-white border rounded-lg p-4 flex items-center justify-between"
            >
              <div
                className="flex items-center gap-4"
                draggable
                droppable="true"
                onTouchStart={(evt) => startDrag1(evt, obj)}
                onDragStart={(evt) => startDrag(evt, obj)}
              >
                <FolderIcon className="h-6  w-6 text-gray-500" />
                <div>
                  <h3 className="font-medium">{obj}</h3>
                  <p className="text-gray-500 text-sm">
                    {webshop.products.filter((prod) => prod.caja == obj)
                      .length + " Productos"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      {" "}
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[300px] sm:max-w-[425px] h-2/3">
                    <DialogHeader>
                      <DialogTitle>Agregar Productos</DialogTitle>
                      <DialogDescription>
                        Indique los productos a los q le va a agregar esta
                        categoria
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-full w-full rounded-md border p-4">
                      <div className="grid gap-4 py-4">
                        {webshop.products
                          .sort((a, b) => {
                            if (a.caja === obj && b.caja !== obj) {
                              return -1; // 'a' debe ir primero
                            }
                            if (a.caja !== obj && b.caja === obj) {
                              return 1; // 'b' debe ir primero
                            }
                            return 0; // Mantener el orden original si ambos son iguales
                          })
                          .map((prod, ind2) => (
                            <div
                              key={ind2}
                              className="flex justify-between items-center gap-4"
                            >
                              <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {prod.title}
                              </Label>
                              <div className="flex justify-between items-center gap-1">
                                {products
                                  .filter(
                                    (prod2) => prod2.productId == prod.productId
                                  )
                                  .map((prod2) => (
                                    <Checkbox
                                      checked={prod2.caja == obj}
                                      onCheckedChange={() => {
                                        setproducts(
                                          products.map((prod1) => {
                                            if (
                                              prod1.productId == prod.productId
                                            ) {
                                              if (prod1.caja !== obj) {
                                                return {
                                                  ...prod1,
                                                  caja: obj,
                                                };
                                              } else {
                                                return {
                                                  ...prod1,
                                                  caja: prod.caja,
                                                };
                                              }
                                            } else {
                                              return prod1;
                                            }
                                          })
                                        );
                                      }}
                                    />
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => Eliminar(obj)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="bg-white p-2 flex justify-end sticky bottom-0">
            <Button
              className={`bg-black hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded ${
                downloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={downloading}
            >
              {downloading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
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

function FolderIcon(props) {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function PencilIcon(props) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
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
