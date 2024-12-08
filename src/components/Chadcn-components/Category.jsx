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
import { Pencil, TrashIcon, FolderIcon, Loader } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ConfimationOut from "../globalFunction/confimationOut";
import { Textarea } from "../ui/textarea";

export default function Category({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [add, setAdd] = useState(false);
  const [newCat, setNewCat] = useState({});
  const [data, setData] = useState({ category: [], UUID: "" });
  const { toast } = useToast();
  const form = useRef(null);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    if (webshop.store.categoria.length > 0) {
      setData({
        category: webshop.store.categoria,
        UUID: webshop.store.UUID,
      });
    }
  }, [webshop]);

  const handleDelete = async (categoryToDelete) => {
    setDeleting(true);

    try {
      const res = await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/categoria`,
        {
          data: { UUID: categoryToDelete }, // El cuerpo debe ir en `data`
          headers: { "Content-Type": "application/json" }, // Usa el tipo correcto
        }
      );

      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Categoria Eliminada",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
        const updatedCategories = data.category.filter(
          (item) => item.id !== categoryToDelete
        );
        setWebshop({
          ...webshop,
          store: { ...webshop.store, categoria: updatedCategories },
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorías.",
      });
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);

    const formData = new FormData();
    formData.append("categoria", JSON.stringify(data.category));
    formData.append("UUID", data.UUID);
    try {
      const res = await axios.put(
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
        console.log(res?.data?.data);
        setWebshop({
          ...webshop,
          store: { ...webshop.store, categoria: res?.data?.data },
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar las categorías.",
      });
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setAdd(true);
    if (newCat.name) {
      try {
        const res = await axios.post(
          `/api/tienda/${webshop.store.sitioweb}/categoria`,
          {
            data: {
              ...newCat,
              storeId: webshop.store.UUID,
              order: data.length,
            }, // El cuerpo debe ir en `data`
            headers: { "Content-Type": "application/json" }, // Usa el tipo correcto
          }
        );

        if (res.status === 200) {
          toast({
            title: "Tarea Ejecutada",
            description: "Categoria Creada",
            action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
          });
          console.log(res.data.data);
          setData((prevData) => ({
            ...prevData,
            category: [...prevData.category, res.data.data],
          }));
          setNewCat({});
        }
      } catch (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "No se pudo editar las categorías.",
        });
        console.error(error);
      } finally {
        setNewCat({});

        setAdd(false);
      }
      form.current?.reset();
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Tiene q agregar un nombre a la categoria.",
      });
      form.current?.reset();
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const reorderedCategories = reorder(
      data.category,
      source.index,
      destination.index
    );
    setData((prevData) => ({ ...prevData, category: reorderedCategories }));
  };
  return (
    <main className="py-2 px-6">
      <div className="p-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"> Agregar Categoria</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form
              className="bg-white border rounded-lg p-2 space-y-2 flex flex-col align-center"
              onSubmit={addCategory}
            >
              <DialogHeader>
                <DialogTitle>Agregar Categoria</DialogTitle>
                <DialogDescription>Crea una Categoria</DialogDescription>
              </DialogHeader>
              <div className="mt-8 mb-5 space-y-4">
                <div className="flex justify-between">
                  <h2 className="text-lg font-bold mb-4">Agregar Categoría</h2>
                </div>
                <Input
                  id="nameForCategoryNew"
                  placeholder="Ingresa el nombre de la categoría"
                  type="text"
                  value={newCat.name || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, name: e.target.value })
                  }
                />
                <Input
                  id="descriptionForCategoryNew"
                  placeholder="Ingresa la descripcion de la categoría"
                  type="text"
                  value={newCat.description || ""}
                  onChange={(e) =>
                    setNewCat({ ...newCat, description: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={add}>
                  {!add ? "Save changes" : "Saving"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Droppable droppableId={webshop.store.sitioweb || "unique"}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="gap-4"
              >
                {data.category
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <CategoryItem
                      key={index}
                      index={index}
                      category={category}
                      products={webshop.products}
                      onDelete={handleDelete}
                      deleting={deleting}
                      setData={setData}
                      handleSubmit={handleSubmit}
                      downloading={downloading}
                      onUpdateProducts={(updatedProducts) =>
                        setData((prev) => ({
                          ...prev,
                          products: updatedProducts,
                        }))
                      }
                    />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Button
            className={`bg-black hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading}
            type="submit"
            id="Guardar"
          >
            {downloading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DragDropContext>
      <ConfimationOut action={hasPendingChanges(data, webshop)} />
    </main>
  );
}

const CategoryItem = ({
  index,
  category,
  products,
  onDelete,
  onUpdateProducts,
  deleting,
  setData,
  handleSubmit,
  downloading,
}) => (
  <Draggable draggableId={`draggable-${index}`} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="bg-white border rounded-lg p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <FolderIcon className="h-6 w-6 text-gray-500" />
          <div>
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-gray-500 text-sm">
              {products.filter((prod) => prod.caja === category.id).length}{" "}
              Productos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar {category.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className=" gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    defaultValue={category.name}
                    onChange={(e) => {
                      setData((prevData) => ({
                        ...prevData,
                        category: prevData.category.map((obj) =>
                          obj.id == category.id
                            ? { ...obj, name: e.target.value }
                            : obj
                        ),
                      }));
                    }}
                  />
                </div>
                <div className="gap-4">
                  <Label htmlFor="username" className="text-right">
                    Descripcion
                  </Label>
                  <Textarea
                    id="username"
                    defaultValue={category.description}
                    onChange={(e) => {
                      setData((prevData) => ({
                        ...prevData,
                        category: prevData.category.map((obj) =>
                          obj.id == category.id
                            ? { ...obj, description: e.target.value }
                            : obj
                        ),
                      }));
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmit}
                  className={`bg-black hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded ${
                    downloading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={downloading}
                >
                  {downloading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            id="deletingCat"
            type="button"
            onClick={() => onDelete(category.id)}
          >
            {!deleting ? (
              <TrashIcon className="h-4 w-4 text-red-500" />
            ) : (
              <Loader className=" animate-spin h-4 w-4 text-red-500" />
            )}
          </Button>
        </div>
      </div>
    )}
  </Draggable>
);

// Utilidad y helpers
const hasPendingChanges = (data, webshop) => {
  return (
    JSON.stringify(data.category) !== JSON.stringify(webshop.store.categoria)
  );
};

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((obj, ind) => {
    return { ...obj, order: ind };
  });
};
