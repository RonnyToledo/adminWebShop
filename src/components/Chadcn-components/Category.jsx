"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
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
import { Plus, TrashIcon, FolderIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Loading from "../component/loading";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState([]);
  const { toast } = useToast();
  const form = useRef(null);
  const [formulario, setFormulario] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (webshop.store.categoria.length > 0) {
      setCategory(webshop.store.categoria);
      setProducts(webshop.products);
      setLoading(true);
    }
  }, [webshop]);

  const Eliminar = (obj) => {
    const updatedCategories = webshop.store.categoria.filter(
      (item) => item !== obj
    );
    setWebshop({
      ...webshop,
      store: { ...webshop.store, categoria: updatedCategories },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fixedDict = Object.fromEntries(
      webshop.products.map((obj) => [obj.id, obj])
    );
    const differentProducts = products.filter(
      (obj) => fixedDict[obj.id]?.caja !== obj.caja
    );

    setDownloading(true);

    const formData = new FormData();
    formData.append("categoria", JSON.stringify(category));
    formData.append("products", JSON.stringify(differentProducts));

    try {
      const res = await axios.post(
        `/api/tienda/${webshop.store.sitioweb}/categoria`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Información actualizada",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorías.",
      });
    } finally {
      setDownloading(false);
      setWebshop({
        ...webshop,
        store: { ...webshop.store, categoria: category },
        products,
      });
    }
  };

  const resetForm = () => {
    setFormulario(false);
    form.current?.reset();
    setNewCat("");
  };

  const catSubmit = (e) => {
    e.preventDefault();
    setCategory([...category, newCat]);
    resetForm();
  };
  const DragAndDrop = (result) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    if (
      source.index == destination.index &&
      source.droppableId == destination.droppableId
    ) {
      return;
    } else {
      setCategory((prevCat) => {
        console.log(reorder(prevCat, source.index, destination.index));
        return reorder(prevCat, source.index, destination.index);
      });
    }
  };
  return (
    <main className="py-8 px-6">
      <div className="mb-6">
        <Button
          size="sm"
          onClick={() => (formulario ? resetForm() : setFormulario(true))}
        >
          {formulario ? "Cerrar" : "Agregar Categoría"}
        </Button>
      </div>
      {formulario && (
        <div className="mt-8 mb-5">
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

      <DragDropContext onDragEnd={DragAndDrop}>
        <form onSubmit={handleSubmit}>
          <div>
            <Droppable droppableId={webshop?.store?.sitioweb || "unique"}>
              {(droppableProvided) => (
                <div
                  {...droppableProvided.droppableProps}
                  ref={droppableProvided.innerRef}
                  className="space-y-4"
                >
                  {category.map((obj, ind) => (
                    <Draggable
                      key={ind}
                      draggableId={`draggable-${ind}`}
                      index={ind}
                    >
                      {(draggableProvided) => (
                        <div
                          {...draggableProvided.draggableProps}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.dragHandleProps}
                          className="bg-white border rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <FolderIcon className="h-6 w-6 text-gray-500" />
                            <div>
                              <h3 className="font-medium">{obj}</h3>
                              <p className="text-gray-500 text-sm">
                                {
                                  webshop.products.filter(
                                    (prod) => prod.caja === obj
                                  ).length
                                }
                                Productos
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="w-full" variant="outline">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[300px] sm:max-w-[425px] h-2/3">
                                <DialogHeader>
                                  <DialogTitle>Agregar Productos</DialogTitle>
                                  <DialogDescription>
                                    Indique los productos a los que le va a
                                    agregar esta categoría ({obj})
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-full w-full rounded-md border p-4">
                                  <div className="grid gap-4 py-4">
                                    {webshop.products
                                      .sort((a, b) => {
                                        if (a.caja === obj && b.caja !== obj) {
                                          return -1;
                                        }
                                        if (a.caja !== obj && b.caja === obj) {
                                          return 1;
                                        }
                                        return 0;
                                      })
                                      .map((prod) => (
                                        <div
                                          key={prod.productId}
                                          className="flex justify-between items-center gap-4"
                                        >
                                          <Label
                                            htmlFor="terms"
                                            className="text-sm font-medium"
                                          >
                                            {prod.title}
                                          </Label>
                                          <Checkbox
                                            checked={prod.caja === obj}
                                            onCheckedChange={() =>
                                              setProducts((prevProducts) =>
                                                prevProducts.map((p) =>
                                                  p.productId === prod.productId
                                                    ? {
                                                        ...p,
                                                        caja:
                                                          p.caja === obj
                                                            ? ""
                                                            : obj,
                                                      }
                                                    : p
                                                )
                                              )
                                            }
                                          />
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
                      )}
                    </Draggable>
                  ))}

                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
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
      </DragDropContext>
    </main>
  );
}
const reorder = (list, startIndex, endIndex) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
